# Scrapbox TOC (Persistent Sidebar)

A Tampermonkey userscript that adds a persistent table of contents sidebar to Scrapbox pages.

## Overview

This userscript creates a fixed sidebar that displays a table of contents for Scrapbox pages. The sidebar remains visible and provides quick navigation to section headers within the current page.

## Features

* **Persistent Sidebar**: Always visible on desktop screens (min-width: 1000px)
* **Automatic TOC Generation**: Automatically detects section titles and creates numbered navigation links
* **Smooth Scrolling**: Click on TOC items to smoothly scroll to the corresponding section
* **Responsive Design**: Automatically hides on mobile/tablet screens for better usability
* **Dark Mode Support**: Adapts to Scrapbox's dark theme
* **Real-time Updates**: TOC updates automatically as you edit the page content
* **Clean UI**: Minimalist design that integrates seamlessly with Scrapbox's interface

## Installation

1. **Install a Userscript Manager**:
   Install Tampermonkey extension for your browser (Chrome, Firefox, Safari, etc.)

2. **Add the Script**:
   Copy the userscript code and paste it into a new Tampermonkey script, then save and enable it.

## Usage

This userscript works on all Scrapbox pages (`https://scrapbox.io/*`).

### How it Works

* The script automatically detects section titles (lines with `.section-title` class)
* Creates a numbered table of contents in a fixed left sidebar
* Excludes the page title and lines starting with `#` from the TOC
* When no content is available, displays "No contents" message
* Clicking on TOC items scrolls smoothly to the corresponding section
* The sidebar is automatically hidden on screens smaller than 1000px width

### Browser Compatibility

Tested and confirmed to work on:
* Google Chrome
* Firefox
* Safari
* Brave Browser

## Technical Details

* **Version**: 2.6
* **Sidebar Width**: 260px
* **Z-index**: 100 (ensures sidebar stays on top)
* **Update Delay**: 500ms (prevents excessive updates during rapid editing)
* **Scroll Offset**: 80px (accounts for Scrapbox's top navigation)

## Disclaimer

This userscript is provided under the **MIT License**.

* **No Warranty**: The author provides no warranty regarding the functionality, accuracy, or reliability of this script.
* **Use at Your Own Risk**: Users are solely responsible for any consequences arising from the use of this script.
* **Compatibility Risk**: This script may stop working without notice due to changes in Scrapbox's specifications or interface.

Please understand these limitations before using this script.
