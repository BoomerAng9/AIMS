import re
from libtmux import Pane
from typing import Literal

def capture_pane_ansi_code(pane: Pane,
    start: Literal["-"] | int | None = None,
    end: Literal["-"] | int | None = None,
) -> str | list[str]:
    """Wrapper for libtmux.Pane.capture_pane"""
    cmd = ["capture-pane", "-e", "-p"]
    if start is not None:
        cmd.extend(["-S", str(start)])
    if end is not None:
        cmd.extend(["-E", str(end)])
    return pane.cmd(*cmd).stdout
