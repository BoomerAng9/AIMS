import argparse
import logging
import uvicorn

from ii_agent.server.app import create_app

logger = logging.getLogger(__name__)


def main():
    """Main entry point for the WebSocket server."""
    # Parse command-line arguments
    parser = argparse.ArgumentParser(
        description="WebSocket Server for interacting with the Agent"
    )
    parser.add_argument(
        "--host",
        type=str,
        default="0.0.0.0",
        help="Host to run the server on",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=8000,
        help="Port to run the server on",
    )
    parser.add_argument("--workers", type=int, default=1, help="Number of worker processes")
    parser.add_argument(
        "--reload",
        default=False,
        type=bool,
        help="Enable auto-reload for development (not recommended for production)",
    )
    args = parser.parse_args()

    # Start the FastAPI server
    logger.info(f"Starting WebSocket server on {args.host}:{args.port}")
    uvicorn.run("ws_server:app", host=args.host, port=args.port, workers=args.workers, reload=args.reload)


# Create app instance for uvicorn workers
app = create_app()


if __name__ == "__main__":
    main()
