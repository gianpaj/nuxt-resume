#!/bin/sh

chromium-browser --headless \
                 --disable-gpu \
                 --disable-software-rasterizer \
                 --disable-dev-shm-usage \
                 --no-sandbox \
                 --print-to-pdf="Nathan Friend - Résumé.pdf" \
                 --hide-scrollbars \
                 https://resume.nathanfriend.io