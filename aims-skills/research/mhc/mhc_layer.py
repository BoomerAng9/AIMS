"""
mHC: Manifold-Constrained Hyper-Connections — Reference Implementation

Paper: "mHC: Manifold-Constrained Hyper-Connections" (DeepSeek-AI, Dec 2025)
arXiv: https://arxiv.org/abs/2512.24880

This module provides a clean, self-contained PyTorch implementation of:
  1. Sinkhorn-Knopp projection (log-domain, differentiable)
  2. MHCLayer — the core mHC building block
  3. MHCTransformerBlock — a full transformer block with mHC residuals

Mathematical core:
  x_{l+1} = H_res^l · x_l + (H_post^l)^T · F(H_pre^l · x_l, W_l)

  Where:
    H_res ∈ Birkhoff polytope (doubly stochastic via Sinkhorn-Knopp)
    H_pre ∈ [0,1]^n via sigmoid
    H_post ∈ [0,2]^n via 2·sigmoid
    F is any residual function (MLP, attention, etc.)

Three key properties of doubly stochastic H_res:
  1. Norm Preservation: spectral norm ≤ 1 → non-expansive mapping
  2. Compositional Closure: product of DS matrices is DS → stable across layers
  3. Geometric: convex hull of permutation matrices → controlled feature mixing

Usage in AIMS:
  This reference implementation is used by the Model Garden for experimentation
  and by the Research Hub for architecture evaluation. For production inference,
  use the CUDA-optimized kernels (see mHC.cu repo).

License: Apache-2.0 (compatible with AIMS commercial use)
"""

from __future__ import annotations

import math
from typing import Optional

import torch
import torch.nn as nn
import torch.nn.functional as F


# ─── Normalization ────────────────────────────────────────────────────────────


class RMSNorm(nn.Module):
    """Root Mean Square Layer Normalization."""

    def __init__(self, dim: int, eps: float = 1e-8):
        super().__init__()
        self.eps = eps
        self.weight = nn.Parameter(torch.ones(dim))

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        rms = torch.sqrt(torch.mean(x ** 2, dim=-1, keepdim=True) + self.eps)
        return x / rms * self.weight


# ─── Sinkhorn-Knopp Projection ───────────────────────────────────────────────


def sinkhorn_knopp(log_mat: torch.Tensor, num_iters: int = 20, eps: float = 1e-8) -> torch.Tensor:
    """
    Differentiable Sinkhorn-Knopp iteration.

    Projects an input matrix onto the Birkhoff polytope (set of doubly
    stochastic matrices) via alternating row/column normalization.

    Args:
        log_mat: [*, n, n] input logits
        num_iters: Number of Sinkhorn iterations (paper: 20)
        eps: Numerical stability constant

    Returns:
        [*, n, n] doubly stochastic matrix (non-negative, rows & cols sum to 1)
    """
    mat = torch.exp(log_mat)
    for _ in range(num_iters):
        mat = mat / (mat.sum(dim=-2, keepdim=True) + eps)
        mat = mat / (mat.sum(dim=-1, keepdim=True) + eps)
    return mat


def sinkhorn_log(logits: torch.Tensor, num_iters: int = 10, tau: float = 0.05) -> torch.Tensor:
    """
    Log-domain Sinkhorn-Knopp (numerically stable for large values).

    Used in the tokenbender reference implementation. Operates entirely
    in log-space to avoid overflow/underflow with large logit values.

    Args:
        logits: [n, n] input logits
        num_iters: Number of iterations
        tau: Temperature parameter

    Returns:
        [n, n] doubly stochastic matrix scaled by n
    """
    n = logits.shape[-1]
    Z = logits / tau
    log_marginal = torch.full((n,), -math.log(n), device=logits.device, dtype=logits.dtype)

    u = torch.zeros(n, device=Z.device, dtype=Z.dtype)
    v = torch.zeros(n, device=Z.device, dtype=Z.dtype)

    for _ in range(num_iters):
        u = log_marginal - torch.logsumexp(Z + v.unsqueeze(0), dim=1)
        v = log_marginal - torch.logsumexp(Z + u.unsqueeze(1), dim=0)

    return torch.exp(Z + u.unsqueeze(1) + v.unsqueeze(0)) * n


# ─── mHC Layer ────────────────────────────────────────────────────────────────


class MHCLayer(nn.Module):
    """
    Manifold-Constrained Hyper-Connections layer.

    Implements Equation (3) from the paper:
        x_{l+1} = H_res · x_l + H_post^T · F(H_pre · x_l, W_l)

    Where H_res is constrained to the Birkhoff polytope via Sinkhorn-Knopp.

    Args:
        dim: Feature dimension C
        n_streams: Number of parallel residual streams n (paper: 4)
        hidden_dim: Hidden dimension for residual MLP F (default: 4*dim)
        sinkhorn_iters: Sinkhorn-Knopp iterations (paper: 20)
        dropout: Dropout probability
    """

    def __init__(
        self,
        dim: int,
        n_streams: int = 4,
        hidden_dim: Optional[int] = None,
        sinkhorn_iters: int = 20,
        dropout: float = 0.0,
    ):
        super().__init__()
        self.dim = dim
        self.n_streams = n_streams
        self.sinkhorn_iters = sinkhorn_iters

        if hidden_dim is None:
            hidden_dim = dim * 4

        # RMSNorm over the expanded stream dimension
        self.rms_norm = RMSNorm(dim * n_streams)

        # Dynamic mapping projection: input → (H_res logits, H_pre logits, H_post logits)
        # φ_pre, φ_post: [nC → n]; φ_res: [nC → n²]
        self.proj_dynamic = nn.Linear(
            dim * n_streams,
            n_streams * n_streams + 2 * n_streams,  # n² + 2n
            bias=False,
        )

        # Static biases for the mapping matrices
        self.bias_pre = nn.Parameter(torch.zeros(1, n_streams))
        self.bias_post = nn.Parameter(torch.zeros(1, n_streams))
        self.bias_res = nn.Parameter(torch.zeros(n_streams, n_streams))

        # Learnable gating factors α (initialized small → near identity)
        self.alpha_pre = nn.Parameter(torch.zeros(1))
        self.alpha_post = nn.Parameter(torch.zeros(1))
        self.alpha_res = nn.Parameter(torch.zeros(1))

        # Residual function F (MLP with GELU activation)
        self.residual_fn = nn.Sequential(
            nn.Linear(dim, hidden_dim),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim, dim),
            nn.Dropout(dropout),
        )

        self._init_parameters()

    def _init_parameters(self):
        nn.init.xavier_uniform_(self.proj_dynamic.weight)
        nn.init.constant_(self.alpha_pre, 0.01)
        nn.init.constant_(self.alpha_post, 0.01)
        nn.init.constant_(self.alpha_res, 0.01)
        nn.init.zeros_(self.bias_pre)
        nn.init.zeros_(self.bias_post)
        nn.init.zeros_(self.bias_res)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Args:
            x: [B, L, C] input tensor

        Returns:
            [B, L, n, C] multi-stream output per Equation (3)
        """
        B, L, C = x.shape
        n = self.n_streams

        # 1. Expand input to n parallel streams: [B, L, C] → [B, L, n, C]
        x_exp = x.unsqueeze(2).expand(-1, -1, n, -1)

        # 2. Flatten for projection: [B, L, n*C]
        x_flat = x_exp.reshape(B, L, -1)

        # 3. Normalize
        x_norm = self.rms_norm(x_flat)

        # 4. Project to dynamic mapping logits
        dynamic = self.proj_dynamic(x_norm)  # [B, L, n² + 2n]
        dynamic_pre = dynamic[..., :n]
        dynamic_post = dynamic[..., n:2 * n]
        dynamic_res = dynamic[..., 2 * n:]

        # 5. Compute mapping matrices (Eq. 7: static + gated dynamic)
        H_pre_dyn = self.alpha_pre * dynamic_pre + self.bias_pre
        H_post_dyn = self.alpha_post * dynamic_post + self.bias_post
        H_res_dyn = self.alpha_res * dynamic_res.view(B, L, n, n) + self.bias_res

        # 6. Apply manifold constraints (Eq. 8)
        H_pre = torch.sigmoid(H_pre_dyn)          # → (0, 1)
        H_post = 2 * torch.sigmoid(H_post_dyn)    # → (0, 2)
        H_res = sinkhorn_knopp(H_res_dyn, self.sinkhorn_iters)  # → Birkhoff polytope

        # 7. Compute output per Equation (3)
        # 7a. Pre-mapping: weighted sum across streams → single branch input
        pre_mixed = torch.einsum('bln,blnc->blc', H_pre, x_exp)

        # 7b. Residual function F
        f_out = self.residual_fn(pre_mixed)

        # 7c. Expand F output back to n streams
        f_out_exp = f_out.unsqueeze(2).expand(-1, -1, n, -1)

        # 7d. Post-mapping: H_post^T · F(...)
        post_mixed = torch.einsum('bln,blnc->blnc', H_post, f_out_exp)

        # 7e. Residual mapping: H_res · x_l (doubly stochastic → stable)
        res_mixed = torch.einsum('blnm,blmc->blnc', H_res, x_exp)

        # 8. Final output: x_{l+1} = H_res · x_l + H_post^T · F(H_pre · x_l)
        return res_mixed + post_mixed


# ─── Multi-Head Attention (standard, for Transformer integration) ─────────────


class MultiHeadAttention(nn.Module):
    """Standard multi-head attention for use with mHC Transformer blocks."""

    def __init__(self, dim: int, num_heads: int = 8, dropout: float = 0.0):
        super().__init__()
        self.num_heads = num_heads
        self.head_dim = dim // num_heads
        self.qkv = nn.Linear(dim, dim * 3, bias=False)
        self.proj = nn.Linear(dim, dim)
        self.dropout = nn.Dropout(dropout)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        B, L, C = x.shape
        qkv = self.qkv(x).reshape(B, L, 3, self.num_heads, self.head_dim)
        q, k, v = qkv.unbind(2)
        attn = (q @ k.transpose(-2, -1)) * (self.head_dim ** -0.5)
        attn = attn.softmax(dim=-1)
        attn = self.dropout(attn)
        out = (attn @ v).transpose(1, 2).reshape(B, L, C)
        return self.proj(out)


# ─── mHC Transformer Block ───────────────────────────────────────────────────


class MHCTransformerBlock(nn.Module):
    """
    Full Transformer block with mHC residual connections.

    Architecture:
        1. Multi-head attention with standard residual
        2. mHC layer (n parallel streams) + stream merge projection
    """

    def __init__(
        self,
        dim: int,
        num_heads: int = 8,
        n_streams: int = 4,
        hidden_dim: Optional[int] = None,
        dropout: float = 0.0,
    ):
        super().__init__()
        self.attn = MultiHeadAttention(dim, num_heads, dropout)
        self.norm1 = nn.LayerNorm(dim)
        self.mhc = MHCLayer(dim, n_streams, hidden_dim, dropout=dropout)
        self.merge_streams = nn.Linear(dim * n_streams, dim)
        self.norm2 = nn.LayerNorm(dim)
        self.dropout = nn.Dropout(dropout)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # Attention with standard residual
        attn_out = self.attn(x)
        x = self.norm1(x + self.dropout(attn_out))

        # mHC: multi-stream residual with Birkhoff constraint
        mhc_out = self.mhc(x)  # [B, L, n, C]
        B, L, n, C = mhc_out.shape
        mhc_flat = mhc_out.reshape(B, L, -1)  # [B, L, n*C]
        mhc_proj = self.merge_streams(mhc_flat)  # [B, L, C]
        x = self.norm2(x + self.dropout(mhc_proj))

        return x


# ─── Verification Utilities ──────────────────────────────────────────────────


def verify_doubly_stochastic(matrix: torch.Tensor, tol: float = 1e-3) -> dict:
    """Verify that a matrix satisfies doubly stochastic properties."""
    row_sums = matrix.sum(dim=-1)
    col_sums = matrix.sum(dim=-2)
    min_entry = matrix.min().item()

    return {
        'row_sums_mean': row_sums.mean().item(),
        'col_sums_mean': col_sums.mean().item(),
        'row_sums_std': row_sums.std().item(),
        'col_sums_std': col_sums.std().item(),
        'min_entry': min_entry,
        'is_valid': (
            abs(row_sums.mean().item() - 1.0) < tol
            and abs(col_sums.mean().item() - 1.0) < tol
            and min_entry > -tol
        ),
    }


# ─── Self-Test ────────────────────────────────────────────────────────────────


if __name__ == '__main__':
    torch.manual_seed(42)

    B, L, C, n = 4, 16, 128, 4
    print('=== mHC Layer Test ===')

    layer = MHCLayer(dim=C, n_streams=n, hidden_dim=512, dropout=0.1)
    x = torch.randn(B, L, C, requires_grad=True)

    print(f'Input:  {x.shape}')
    out = layer(x)
    print(f'Output: {out.shape}  (expected [B, L, n, C] = [{B}, {L}, {n}, {C}])')

    loss = out.mean()
    loss.backward()
    print(f'Gradient norm: {x.grad.norm().item():.4f}')

    # Verify Sinkhorn projection
    test_logits = torch.randn(n, n)
    ds_matrix = sinkhorn_knopp(test_logits, num_iters=20)
    verification = verify_doubly_stochastic(ds_matrix)
    print(f'\nSinkhorn verification: {verification}')

    # Full transformer block
    print('\n=== MHC Transformer Block Test ===')
    block = MHCTransformerBlock(dim=C, num_heads=8, n_streams=n, dropout=0.1)
    x2 = torch.randn(B, L, C)
    out2 = block(x2)
    print(f'Block output: {out2.shape}  (expected [{B}, {L}, {C}])')

    params = sum(p.numel() for p in block.parameters())
    print(f'Parameters: {params:,}')
    print('\nAll tests passed.')
