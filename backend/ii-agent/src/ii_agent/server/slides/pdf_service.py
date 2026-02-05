"""PDF generation service for converting HTML slides to PDF."""

import io
import logging
from typing import List
from playwright.async_api import async_playwright
from pypdf import PdfWriter, PdfReader

from ii_agent.server.slides.models import SlideContentInfo

logger = logging.getLogger(__name__)


async def convert_slides_to_pdf(slides: List[SlideContentInfo]) -> bytes:
    """Convert a list of HTML slides to a single PDF document.

    Args:
        slides: List of SlideContentInfo objects containing HTML content

    Returns:
        bytes: PDF document as bytes

    Raises:
        Exception: If conversion fails
    """
    if not slides:
        raise ValueError("No slides to convert")

    # PDF options for slide format
    pdf_options = {
        'width': '1280px',
        'height': '720px',
        'print_background': True,
        'margin': {
            'top': '0',
            'bottom': '0',
            'left': '0',
            'right': '0'
        },
        'display_header_footer': False,
        'prefer_css_page_size': False,
        'scale': 1
    }

    pdf_buffers = []

    # Launch Playwright
    async with async_playwright() as p:
        # Launch browser in headless mode
        browser = await p.chromium.launch(headless=True)

        try:
            # Create a new browser context
            context = await browser.new_context(
                viewport={'width': 1280, 'height': 720}
            )

            # Convert each slide to PDF
            for slide in slides:
                logger.info(
                    f"Converting slide {slide.slide_number} of presentation {slide.presentation_name}"
                )

                # Create a new page for each conversion
                page = await context.new_page()

                try:
                    # Wait for DOM to be ready first
                    await page.wait_for_load_state('domcontentloaded')
                    # Load HTML content directly into the page (no temp file needed)
                    await page.set_content(slide.slide_content, wait_until='networkidle', timeout=60000)

                    # Generate PDF with exact same parameters as working script
                    pdf_buffer = await page.pdf(
                        print_background=pdf_options['print_background'],
                        margin=pdf_options['margin'],
                        display_header_footer=pdf_options['display_header_footer'],
                        prefer_css_page_size=pdf_options['prefer_css_page_size'],
                        scale=pdf_options['scale'],
                        width=pdf_options['width'],
                        height=pdf_options['height']
                    )

                    # Store buffer for merging
                    pdf_buffers.append(pdf_buffer)

                    logger.info(
                        f"Successfully converted slide {slide.slide_number}"
                    )

                finally:
                    # Ensure page is properly closed
                    await page.close()

        finally:
            await browser.close()

    # Merge all PDFs into one
    logger.info("Merging PDFs...")

    pdf_writer = PdfWriter()

    for pdf_buffer in pdf_buffers:
        pdf_reader = PdfReader(io.BytesIO(pdf_buffer))
        for page in pdf_reader.pages:
            pdf_writer.add_page(page)

    # Save merged PDF to bytes
    output = io.BytesIO()
    pdf_writer.write(output)
    output.seek(0)

    logger.info(f"Created PDF with {len(pdf_writer.pages)} pages")

    return output.read()


async def convert_slides_to_pdf_with_progress(slides: List[SlideContentInfo]):
    """Convert a list of HTML slides to a single PDF document with progress updates.

    Args:
        slides: List of SlideContentInfo objects containing HTML content

    Yields:
        Dict with progress updates and final PDF bytes

    Raises:
        Exception: If conversion fails
    """
    if not slides:
        raise ValueError("No slides to convert")

    # PDF options for slide format - exact configuration from working script
    pdf_options = {
        'width': '1280px',
        'height': '720px',
        'print_background': True,
        'margin': {
            'top': '0',
            'bottom': '0',
            'left': '0',
            'right': '0'
        },
        'display_header_footer': False,
        'prefer_css_page_size': False,
        'scale': 1
    }

    pdf_buffers = []
    total_slides = len(slides)

    # Yield starting message
    yield {
        "type": "progress",
        "message": "Starting PDF generation...",
        "current": 0,
        "total": total_slides,
        "percent": 0
    }

    # Launch Playwright
    async with async_playwright() as p:
        # Launch browser in headless mode
        browser = await p.chromium.launch(headless=True)

        try:
            # Create a new browser context
            context = await browser.new_context(
                viewport={'width': 1280, 'height': 720}
            )

            # Convert each slide to PDF
            for index, slide in enumerate(slides, 1):
                yield {
                    "type": "progress",
                    "message": f"Converting slide {slide.slide_number} of presentation {slide.presentation_name}",
                    "current": index,
                    "total": total_slides,
                    "percent": round((index / total_slides) * 100, 1)
                }

                # Create a new page for each conversion
                page = await context.new_page()

                try:
                    # Wait for DOM to be ready first
                    await page.wait_for_load_state('domcontentloaded')
                    # Load HTML content directly into the page (no temp file needed)
                    await page.set_content(slide.slide_content, wait_until='networkidle', timeout=60000)

                    # Generate PDF with exact same parameters as working script
                    pdf_buffer = await page.pdf(
                        print_background=pdf_options['print_background'],
                        margin=pdf_options['margin'],
                        display_header_footer=pdf_options['display_header_footer'],
                        prefer_css_page_size=pdf_options['prefer_css_page_size'],
                        scale=pdf_options['scale'],
                        width=pdf_options['width'],
                        height=pdf_options['height']
                    )

                    # Store buffer for merging
                    pdf_buffers.append(pdf_buffer)

                    logger.info(f"Successfully converted slide {slide.slide_number}")

                finally:
                    # Ensure page is properly closed
                    await page.close()

        finally:
            await browser.close()

    # Merge all PDFs into one
    yield {
        "type": "progress",
        "message": "Merging PDFs...",
        "current": total_slides,
        "total": total_slides,
        "percent": 95.0
    }

    pdf_writer = PdfWriter()

    for pdf_buffer in pdf_buffers:
        pdf_reader = PdfReader(io.BytesIO(pdf_buffer))
        for page in pdf_reader.pages:
            pdf_writer.add_page(page)

    # Save merged PDF to bytes
    output = io.BytesIO()
    pdf_writer.write(output)
    output.seek(0)

    logger.info(f"Created PDF with {len(pdf_writer.pages)} pages")

    # Final result
    yield {
        "type": "complete",
        "message": f"PDF created with {len(pdf_writer.pages)} pages",
        "pdf_bytes": output.read(),
        "total_pages": len(pdf_writer.pages)
    }