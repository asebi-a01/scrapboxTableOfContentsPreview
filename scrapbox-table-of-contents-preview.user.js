// ==UserScript==
// @name         Scrapbox TOC (Persistent Sidebar)
// @namespace    https://scrapbox.io/asebi/
// @version      2.6
// @description  Keep the TOC sidebar visible even when there is no content.
// @author       asebi / modified
// @match        https://scrapbox.io/*
// @grant        GM_addStyle
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    const SIDEBAR_WIDTH = '260px';
    let observer = null;
    let lastHref = location.href;

    // --- Style Injection ---
    GM_addStyle(`
        /* デスクトップ表示では常に余白を確保 */
        @media screen and (min-width: 1000px) {
            body {
                padding-left: ${SIDEBAR_WIDTH} !important;
                transition: padding-left 0.3s ease;
            }
            #scrapbox-toc-container {
                display: block !important; /* 強制表示 */
            }
        }

        #scrapbox-toc-container {
            position: fixed;
            left: 0;
            top: 0;
            width: ${SIDEBAR_WIDTH};
            height: 100vh;
            padding: 80px 15px 20px 20px;
            background-color: #fefefe;
            border-right: 1px solid rgba(0,0,0,0.05);
            overflow-y: auto;
            z-index: 100;
            font-size: 13.5px;
        }

        #scrapbox-toc-container h3 {
            margin: 0 0 15px 0;
            font-size: 12px;
            font-weight: bold;
            color: #999;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            border-bottom: 1px solid #eee;
            padding-bottom: 8px;
        }

        #scrapbox-toc-list {
            list-style: none;
            padding: 0;
            margin: 0;
            counter-reset: toc-counter;
        }

        #scrapbox-toc-list li {
            margin-bottom: 4px;
            counter-increment: toc-counter;
        }

        /* 目次が空の時のメッセージ用 */
        #scrapbox-toc-list .no-item {
            color: #ccc;
            padding: 6px 8px;
            font-style: italic;
        }

        #scrapbox-toc-list li a {
            text-decoration: none;
            color: #444;
            display: block;
            padding: 6px 8px;
            border-radius: 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            transition: all 0.2s ease;
        }

        #scrapbox-toc-list li a::before {
            content: counter(toc-counter) ". ";
            margin-right: 8px;
            font-family: monospace;
            color: #888;
            font-weight: bold;
        }

        #scrapbox-toc-list li a:hover {
            background-color: #f0f0f0;
            color: #000;
            padding-left: 12px;
        }

        body.dark #scrapbox-toc-container { background-color: #1d1f21; border-right-color: #333; }
        body.dark #scrapbox-toc-container h3 { color: #666; border-bottom-color: #333; }
        body.dark #scrapbox-toc-container li a { color: #aaa; }
        body.dark #scrapbox-toc-list li a::before { color: #666; }
        body.dark #scrapbox-toc-container li a:hover { background-color: #2d2f31; color: #fff; }

        @media screen and (max-width: 999px) {
            #scrapbox-toc-container { display: none !important; }
            body { padding-left: 0 !important; }
        }
    `);

    // 目次コンテナの生成
    const tocContainer = document.createElement('div');
    tocContainer.id = 'scrapbox-toc-container';
    tocContainer.innerHTML = `<h3>Table of Contents</h3><ul id="scrapbox-toc-list"></ul>`;
    document.body.appendChild(tocContainer);

    function createTocItem(lineElement) {
        const textElement = lineElement.querySelector('.text');
        const titleText = textElement ? textElement.textContent.trim() : lineElement.textContent.trim();
        if (!titleText) return null;

        const listItem = document.createElement('li');
        const anchor = document.createElement('a');
        anchor.textContent = titleText;
        anchor.href = `#${lineElement.id}`;

        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.getElementById(lineElement.id);
            if (target) {
                window.scrollTo({
                    top: target.getBoundingClientRect().top + window.pageYOffset - 80,
                    behavior: 'smooth'
                });
            }
        });
        listItem.appendChild(anchor);
        return listItem;
    }

    function updateToc() {
        const list = document.getElementById('scrapbox-toc-list');
        if (!list) return;
        list.innerHTML = '';

        const allHeaders = Array.from(document.querySelectorAll('.editor .lines .line.section-title'));
        const headers = allHeaders.slice(1).filter(h => {
            const textElement = h.querySelector('.text');
            const titleText = textElement ? textElement.textContent.trim() : h.textContent.trim();
            return !titleText.startsWith('#');
        });

        if (headers.length === 0) {
            const noItem = document.createElement('li');
            noItem.className = 'no-item';
            noItem.textContent = 'No contents';
            list.appendChild(noItem);
        } else {
            headers.forEach(h => {
                if (!h.id) h.id = 'toc-' + Math.random().toString(36).slice(2, 9);
                const item = createTocItem(h);
                if (item) list.appendChild(item);
            });
        }
    }

    function init() {
        if (observer) observer.disconnect();

        const target = document.querySelector('.editor .lines');
        if (target) {
            observer = new MutationObserver(() => {
                clearTimeout(window.tocTimer);
                window.tocTimer = setTimeout(updateToc, 500);
            });
            observer.observe(target, { childList: true, subtree: true, characterData: true });
            updateToc();
        } else {
            // エディタがない状態（ホーム画面など）でも、とりあえず目次の中身を空にする
            updateToc();
            setTimeout(init, 500);
        }
    }

    const urlObserver = new MutationObserver(() => {
        if (lastHref !== location.href) {
            lastHref = location.href;
            init();
        }
    });

    urlObserver.observe(document.querySelector('title'), { childList: true });

    init();
    window.addEventListener('popstate', () => setTimeout(init, 500));
})();