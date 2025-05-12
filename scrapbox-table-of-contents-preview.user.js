// ==UserScript==
// @name         Scrapbox Table of Contents Preview (Draggable Icon & No LR-Move Buttons)
// @namespace    https://scrapbox.io/asebi/
// @version      1.0
// @description  Displays a draggable (even as icon), collapsible, fixed table of contents on Scrapbox pages.
// @author       asebi
// @match        https://scrapbox.io/*
// @grant        GM_addStyle
// @run-at       document-idle
// @license      MIT License
// @icon         https://scrapbox.io/favicon.ico
// ==/UserScript==

(function() {
    'use strict';

    // --- User Configurable Settings ---
    const TOC_DEFAULT_RIGHT_PX = 20;
    const TOC_DEFAULT_TOP_PX = 70;
    const STORAGE_KEY_RIGHT = 'scrapboxTocRightPosition_v1.3.3'; // Versioning storage keys
    const STORAGE_KEY_TOP = 'scrapboxTocTopPosition_v1.3.3';
    const DRAG_THRESHOLD_PX = 5; // Minimum pixels to move before considering it a drag
    // --- End of Settings ---

    // --- Style Injection ---
    GM_addStyle(`
        #scrapbox-toc-container {
            position: fixed; width: 280px; overflow-y: auto; background-color: #f9f9f9; border: 1px solid #ccc;
            border-radius: 5px; padding: 12px; box-shadow: 0 3px 7px rgba(0,0,0,0.15); z-index: 10001;
            font-size: 14px; line-height: 1.5;
            transition: width 0.25s ease-in-out, height 0.25s ease-in-out, max-height 0.25s ease-in-out, padding 0.25s ease-in-out, opacity 0.25s ease-in-out, border-radius 0.25s ease-in-out;
        }
        #scrapbox-toc-container.dragging { /* Applies when dragging either expanded or collapsed */
            cursor: grabbing !important; /* Ensure grabbing cursor overrides others */
            user-select: none;
            transition: none !important; /* No transitions during drag for responsiveness */
            box-shadow: 0 5px 15px rgba(0,0,0,0.3); /* More prominent shadow when dragging */
        }
        #scrapbox-toc-container h3 { /* Common styles for h3 in both states */
            margin-top: 0;
            font-size: 16px; /* For expanded state text, icon size is separate */
            font-weight: bold;
            color: #333;
            cursor: grab; /* Draggable in both states */
            user-select: none;
            display: flex;
            justify-content: space-between; /* Title left, controls right (if any) */
            align-items: center;
            /* border-bottom and padding specific to expanded state */
            border-bottom: 1px solid #eee;
            margin-bottom: 10px;
            padding-bottom: 8px;
        }
        #scrapbox-toc-container.collapsed h3 { /* Specific overrides for collapsed state */
            justify-content: center; /* Center the icon */
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
            width: 100%; /* Fill the small container */
            height: 100%;
        }
        #scrapbox-toc-title-text { display: inline; flex-grow: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        #toc-position-controls { display: none; white-space: nowrap; flex-shrink: 0; } /* Controls container for reset button */
        .toc-move-btn { /* Styling for the reset button */
            background: none; border: 1px solid #ddd; border-radius: 3px; padding: 2px 6px;
            /* margin-left: 5px; /* Reset button is likely the only one, adjust if needed */
            cursor: pointer; font-size: 14px; line-height: 1; color: #555;
            transition: background-color 0.15s, border-color 0.15s;
        }
        .toc-move-btn:hover { background-color: #f0f0f0; border-color: #bbb; color: #333; }
        .toc-move-btn:active { background-color: #e0e0e0; }
        #scrapbox-toc-container ul { list-style: none; padding-left: 0; margin: 0; overflow: hidden; }
        #scrapbox-toc-container li a {
            text-decoration: none; color: #007bff; display: block; padding: 6px 3px; border-radius: 3px;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis; transition: background-color 0.2s ease-in-out;
        }
        #scrapbox-toc-container li a:hover { background-color: #e9ecef; color: #0056b3; }
        #scrapbox-toc-container.collapsed { /* Styles for the icon state */
            width: 44px; height: 44px; max-height: 44px; padding: 0; overflow: hidden;
            display: flex; align-items: center; justify-content: center; border-radius: 50%;
        }
        #scrapbox-toc-container.collapsed #scrapbox-toc-title-text,
        #scrapbox-toc-container.collapsed #toc-position-controls { display: none; } /* Hide text and controls in icon state */
        #scrapbox-toc-container.collapsed #scrapbox-toc-list { display: none; }
        #scrapbox-toc-container h3::before { /* The icon itself */
            content: "📄"; font-family: "Segoe UI Emoji", "Segoe UI Symbol", "Apple Color Emoji", "Noto Color Emoji", sans-serif;
            font-size: 20px; color: #333; line-height: 1; display: none; /* Only shown when collapsed */
        }
        #scrapbox-toc-container.collapsed h3::before { display: block; margin: 0; /* Ensure icon is centered */ }

        /* Dark Mode Adjustments */
        body.dark #scrapbox-toc-container { background-color: #2c2c2c; border-color: #444; color: #ccc; }
        body.dark #scrapbox-toc-container h3 { color: #eee; border-bottom-color: #4a4a4a; }
        body.dark .toc-move-btn { border-color: #555; color: #ccc; }
        body.dark .toc-move-btn:hover { background-color: #3a3a3a; border-color: #777; }
        body.dark .toc-move-btn:active { background-color: #484848; }
        body.dark #scrapbox-toc-container.collapsed h3::before { color: #eee; }
        body.dark #scrapbox-toc-container li a { color: #82c0ff; }
        body.dark #scrapbox-toc-container li a:hover { background-color: #3a3a3a; color: #a9d7ff; }
        body.dark #scrapbox-toc-container::-webkit-scrollbar-thumb { background: #555; }
        /* Scrollbar Base Styles */
        #scrapbox-toc-container::-webkit-scrollbar { width: 6px; }
        #scrapbox-toc-container::-webkit-scrollbar-track { background: transparent; }
        #scrapbox-toc-container::-webkit-scrollbar-thumb { background: #ccc; border-radius: 3px; }
    `);

    const tocContainer = document.createElement('div');
    tocContainer.id = 'scrapbox-toc-container';
    tocContainer.innerHTML = `
        <h3 id="scrapbox-toc-title">
            <span id="scrapbox-toc-title-text">Table Of Contents</span>
            <span id="toc-position-controls">
                <button class="toc-move-btn" data-action="reset" title="Reset Position">⟲</button>
            </span>
        </h3>
        <ul id="scrapbox-toc-list"></ul>`;
    document.body.appendChild(tocContainer);
    tocContainer.style.display = 'none';

    let currentRight = parseInt(localStorage.getItem(STORAGE_KEY_RIGHT), 10);
    if (isNaN(currentRight)) currentRight = TOC_DEFAULT_RIGHT_PX;
    let currentTop = parseInt(localStorage.getItem(STORAGE_KEY_TOP), 10);
    if (isNaN(currentTop)) currentTop = TOC_DEFAULT_TOP_PX;

    function applyPositionAndSize() {
        tocContainer.style.right = `${currentRight}px`;
        tocContainer.style.top = `${currentTop}px`;
        tocContainer.style.maxHeight = `calc(100vh - ${currentTop + 20}px)`;
    }

    let isTocExpanded = true;

    function applyTocDisplayState() {
        if (!tocContainer) return;
        const tocTitleTextElement = tocContainer.querySelector('#scrapbox-toc-title-text');
        const positionControlsElement = tocContainer.querySelector('#toc-position-controls');
        // const h3Element = tocContainer.querySelector('h3'); // h3 cursor is now mainly CSS controlled

        if (isTocExpanded) {
            tocContainer.classList.remove('collapsed');
            if (tocTitleTextElement) tocTitleTextElement.style.display = 'inline';
            if (positionControlsElement) positionControlsElement.style.display = 'inline-block';
        } else {
            tocContainer.classList.add('collapsed');
            if (tocTitleTextElement) tocTitleTextElement.style.display = 'none';
            if (positionControlsElement) positionControlsElement.style.display = 'none';
        }
        applyPositionAndSize();
    }

    // --- Drag and Drop Logic ---
    let isPotentialDrag = false;
    let isActuallyDragging = false;
    let dragStartX, dragStartY;
    let initialTocRight, initialTocTop;
    const tocTitleElement = tocContainer.querySelector('#scrapbox-toc-title');

    tocTitleElement.addEventListener('mousedown', (e) => {
        if (e.target.closest('.toc-move-btn') || e.button !== 0) { // Ignore if reset button or not left click
            return;
        }
        isPotentialDrag = true;
        isActuallyDragging = false;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        initialTocRight = currentRight; // Record initial position regardless of expanded state
        initialTocTop = currentTop;

        document.addEventListener('mousemove', handleDragMove);
        document.addEventListener('mouseup', handleDragEnd);
        e.preventDefault();
    });

    function handleDragMove(e) {
        if (!isPotentialDrag) return;

        const dx = e.clientX - dragStartX;
        const dy = e.clientY - dragStartY;

        if (!isActuallyDragging && (Math.abs(dx) > DRAG_THRESHOLD_PX || Math.abs(dy) > DRAG_THRESHOLD_PX)) {
            isActuallyDragging = true;
            tocContainer.classList.add('dragging'); // Add dragging class for visual feedback (e.g. cursor)
        }

        if (isActuallyDragging) { // If dragging, update position regardless of expanded state
            currentRight = initialTocRight - dx;
            currentTop = initialTocTop + dy;

            const tocWidth = tocContainer.offsetWidth;
            const tocHeight = tocContainer.offsetHeight;
            currentTop = Math.max(0, Math.min(currentTop, window.innerHeight - tocHeight));
            currentRight = Math.max(0, Math.min(currentRight, window.innerWidth - tocWidth));

            applyPositionAndSize();
        }
        // e.preventDefault(); // Not strictly required here if mousedown did its job
    }

    function handleDragEnd() {
        if (!isPotentialDrag) return;
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);

        tocContainer.classList.remove('dragging'); // Always remove dragging class

        if (isActuallyDragging) { // If a drag truly occurred
            // Save position regardless of expanded state
            localStorage.setItem(STORAGE_KEY_RIGHT, currentRight);
            localStorage.setItem(STORAGE_KEY_TOP, currentTop);
        } else { // If no significant drag, it's a click: toggle expanded state
            isTocExpanded = !isTocExpanded;
            applyTocDisplayState();
        }
        isPotentialDrag = false;
        isActuallyDragging = false; // Reset for the next interaction
    }

    // --- Position Control Button (Reset only) ---
    tocContainer.querySelector('.toc-move-btn[data-action="reset"]').addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent mousedown on h3 from misinterpreting this
        currentRight = TOC_DEFAULT_RIGHT_PX;
        currentTop = TOC_DEFAULT_TOP_PX;
        localStorage.setItem(STORAGE_KEY_RIGHT, currentRight);
        localStorage.setItem(STORAGE_KEY_TOP, currentTop);
        applyPositionAndSize();
        // Optionally, ensure it's expanded after reset, or maintain current state
        // if (!isTocExpanded) {
        //     isTocExpanded = true;
        //     applyTocDisplayState();
        // } else {
        //     applyPositionAndSize(); // Just update position if already expanded
        // }
    });

    // --- Core TOC generation and observation logic (largely unchanged) ---
    function createTocItem(sectionTitleLineElement) {
        const textElement = sectionTitleLineElement.querySelector('.text');
        const titleText = textElement ? textElement.textContent.trim() : sectionTitleLineElement.textContent.trim();
        if (!titleText) return null;

        const listItem = document.createElement('li');
        const anchor = document.createElement('a');
        anchor.textContent = titleText;
        anchor.href = `#${sectionTitleLineElement.id}`;

        anchor.addEventListener('click', (event) => {
            event.preventDefault();
            const targetElement = document.getElementById(sectionTitleLineElement.id);
            if (targetElement) {
                let scrollOffsetValue = 60; // Default fallback
                const tocRectForScroll = tocContainer.getBoundingClientRect();

                if (tocContainer.style.display !== 'none' && isTocExpanded &&
                    tocRectForScroll.top >= 0 && tocRectForScroll.bottom <= window.innerHeight * 0.66) { // TOC visible and in upper 2/3
                     scrollOffsetValue = tocRectForScroll.bottom + 20;
                } else {
                    scrollOffsetValue = TOC_DEFAULT_TOP_PX + 20; // General offset if TOC is hidden, collapsed, or low
                }

                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
                window.scrollTo({ top: targetPosition - scrollOffsetValue, behavior: 'smooth' });

                targetElement.style.transition = 'background-color 0.5s ease';
                targetElement.style.backgroundColor = 'rgba(255, 255, 0, 0.3)';
                setTimeout(() => {
                    if (document.body.contains(targetElement)) {
                        targetElement.style.backgroundColor = '';
                    }
                }, 1500);
            }
        });
        listItem.appendChild(anchor);
        return listItem;
    }

    function updateToc() {
        const tocList = tocContainer.querySelector('#scrapbox-toc-list');
        if (!tocList) return;
        tocList.innerHTML = '';

        const titleElements = document.querySelectorAll('.editor .lines .line.section-title');
        let hasTitles = false;
        titleElements.forEach(lineElement => {
            if (!lineElement.id) {
                lineElement.id = `toc-temp-id-${Math.random().toString(36).substring(2, 9)}`;
            }
            const listItem = createTocItem(lineElement);
            if (listItem) {
                tocList.appendChild(listItem);
                hasTitles = true;
            }
        });

        if (hasTitles) {
            tocContainer.style.display = 'block';
            applyTocDisplayState(); // Set correct view (expanded/collapsed) and apply position
        } else {
            tocContainer.style.display = 'none';
        }
    }

    // --- Observers and Initialisation ---
    let linesObserver = null;
    let debounceTimer = null;
    function observeLines() {
        if (linesObserver) linesObserver.disconnect();
        const targetNode = document.querySelector('.editor .lines');
        if (!targetNode) {
            setTimeout(observeLines, 500); return;
        }
        const config = { childList: true, subtree: true, characterData: true };
        linesObserver = new MutationObserver(() => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(updateToc, 300);
        });
        linesObserver.observe(targetNode, config);
        updateToc(); // Initial TOC build
    }

    let lastUrl = location.href;
    function initializeOrReinitialize() {
        // Ensures correct display state and position based on saved values or defaults.
        // `isTocExpanded` retains its value across page navigations within the SPA.
        applyTocDisplayState();
        observeLines();
    }

    const bodyObserver = new MutationObserver(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            setTimeout(initializeOrReinitialize, 300);
        }
    });

    // Initial setup
    if (document.body) {
        bodyObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
        initializeOrReinitialize();
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            bodyObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
            initializeOrReinitialize();
        });
    }
})();