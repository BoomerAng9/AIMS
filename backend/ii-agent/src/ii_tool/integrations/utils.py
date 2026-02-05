from bs4 import BeautifulSoup


def extract_title(soup):
    """Extract title from BeautifulSoup object."""
    title_tag = soup.find('title')
    return title_tag.get_text() if title_tag else ""


def clean_soup(soup):
    """Remove script and style elements from BeautifulSoup object."""
    for script in soup(['script', 'style']):
        script.decompose()
    return soup


def get_text_from_soup(soup):
    """Extract text content from BeautifulSoup object."""
    text = soup.get_text()
    lines = (line.strip() for line in text.splitlines())
    chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
    text = '\n'.join(chunk for chunk in chunks if chunk)
    return text