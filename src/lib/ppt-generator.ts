import PptxGenJS from 'pptxgenjs';
import { Slide } from '../types'; // Assuming Slide type is defined here or similar

// --- CONFIGURATION --- //
const SLIDE_WIDTH = 10; // inches
const SLIDE_HEIGHT = 5.625; // inches (16:9 aspect ratio)
const MARGIN_TOP = 0.25;
const MARGIN_LEFT = 0.5;
const MARGIN_RIGHT = 0.5;
const MARGIN_BOTTOM = 0.25;
const CONTENT_WIDTH = SLIDE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
const CONTENT_HEIGHT = SLIDE_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM;

const TITLE_OPTIONS = {
    fontSize: 24,
    bold: true,
    color: '0052CC',
    h: 0.75, // Height for the title box
};

/**
 * Formats text with bold parts into the array structure pptxgenjs requires for rich text.
 * @param {string} text - The full text.
 * @param {string[]} boldParts - An array of substrings to make bold.
 * @returns {Array<object>} An array of text objects for pptxgenjs.
 */
function formatTextForPptx(text: string, boldParts: string[] = []) {
    if (!boldParts || boldParts.length === 0) {
        return [{ text }];
    }

    // Create a regex to find all bold parts. Escape special characters.
    const escapedBoldParts = boldParts.map(part => part.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\$&'));
    const boldRegex = new RegExp(`(${escapedBoldParts.join('|')})`, 'g');
    const parts = text.split(boldRegex);

    return parts.filter(part => part).map(part => {
        const isBold = boldParts.includes(part);
        return { text: part, options: { bold: isBold } };
    });
}

/**
 * Measures the height of an HTML string by rendering it in a virtual DOM element.
 * This function is a placeholder and needs a client-side DOM environment to work.
 * For server-side rendering, this would need to be handled differently or avoided.
 * @param {string} htmlContent - The HTML content to measure.
 * @returns {number} The height in inches.
 */
function measureHeight(htmlContent: string, virtualSlideElement: HTMLElement): number {
    virtualSlideElement.innerHTML = htmlContent;
    const pixelHeight = virtualSlideElement.offsetHeight;
    return pixelHeight / 96; // 96 DPI standard for web
}

async function renderParagraph(pptx: PptxGenJS, slide: PptxGenJS.Slide, content: any, startY: number, slideTitle: string, virtualSlideElement: HTMLElement) {
    const richText = formatTextForPptx(content.text, content.bold);
    const htmlToMeasure = `<p style="font-size: 14pt;">${content.text}</p>`;
    const height = measureHeight(htmlToMeasure, virtualSlideElement);

    if (startY + height > CONTENT_HEIGHT) {
        slide = pptx.addSlide();
        slide.addText(`${slideTitle} (cont.)`, { ...TITLE_OPTIONS, x: MARGIN_LEFT, y: MARGIN_TOP, w: CONTENT_WIDTH });
        startY = MARGIN_TOP + TITLE_OPTIONS.h + 0.15;
    }

    slide.addText(richText, {
        x: MARGIN_LEFT,
        y: startY,
        w: CONTENT_WIDTH,
        h: height,
        fontSize: 14,
        color: '333333'
    });

    return { newY: startY + height, slide: slide };
}

async function renderBulletList(pptx: PptxGenJS, slide: PptxGenJS.Slide, content: any, startY: number, slideTitle: string, virtualSlideElement: HTMLElement) {
    for (const item of content.items) {
        const richText = formatTextForPptx(item.text, item.bold);
        const htmlToMeasure = `<p style="font-size: 14pt; margin-left: 20px;">\u2022 ${item.text}</p>`;
        const height = measureHeight(htmlToMeasure, virtualSlideElement) + 0.05;

        if (startY + height > CONTENT_HEIGHT) {
            slide = pptx.addSlide();
            slide.addText(`${slideTitle} (cont.)`, { ...TITLE_OPTIONS, x: MARGIN_LEFT, y: MARGIN_TOP, w: CONTENT_WIDTH });
            startY = MARGIN_TOP + TITLE_OPTIONS.h + 0.15;
        }

        slide.addText(richText, {
            x: MARGIN_LEFT + 0.2,
            y: startY,
            w: CONTENT_WIDTH - 0.2,
            h: height,
            fontSize: 14,
            bullet: true,
            color: '333333'
        });
        startY += height;
    }
    return { newY: startY, slide: slide };
}

async function renderNumberedList(pptx: PptxGenJS, slide: PptxGenJS.Slide, content: any, startY: number, slideTitle: string, virtualSlideElement: HTMLElement) {
    let itemIndex = 1;
    for (const item of content.items) {
        const itemText = `${itemIndex}. ${item.text}`;
        const richText = formatTextForPptx(itemText, item.bold);
        const htmlToMeasure = `<p style="font-size: 14pt; margin-left: 20px;">${itemText}</p>`;
        const height = measureHeight(htmlToMeasure, virtualSlideElement) + 0.05;

        if (startY + height > CONTENT_HEIGHT) {
            slide = pptx.addSlide();
            slide.addText(`${slideTitle} (cont.)`, { ...TITLE_OPTIONS, x: MARGIN_LEFT, y: MARGIN_TOP, w: CONTENT_WIDTH });
            startY = MARGIN_TOP + TITLE_OPTIONS.h + 0.15;
        }

        slide.addText(richText, {
            x: MARGIN_LEFT + 0.2,
            y: startY,
            w: CONTENT_WIDTH - 0.2,
            h: height,
            fontSize: 14,
            color: '333333'
        });
        startY += height;
        itemIndex++;
    }
    return { newY: startY, slide: slide };
}

async function renderTable(pptx: PptxGenJS, slide: PptxGenJS.Slide, content: any, startY: number, slideTitle: string, virtualSlideElement: HTMLElement) {
    const headerOptions = { fill: '0052CC', color: 'FFFFFF', bold: true, fontSize: 12 };
    const rowOptions = { fontSize: 11, color: '333333' };
    const ROW_BUFFER = 0.04;

    let rowsForCurrentSlide: any[] = [];
    rowsForCurrentSlide.push(content.headers.map((h: string) => ({ text: h, options: headerOptions })));

    const headerHtml = `<table><tr style="font-size: 12pt; font-weight: bold;">${content.headers.map((h: string) => `<td>${h}</td>`).join('')}</tr></table>`;
    let tableHeightOnSlide = measureHeight(headerHtml, virtualSlideElement) + ROW_BUFFER;

    for (const row of content.rows) {
        const rowHtml = `<table><tr style="font-size: 11pt;">${row.cells.map((c: string) => `<td>${c}</td>`).join('')}</tr></table>`;
        const rowHeight = measureHeight(rowHtml, virtualSlideElement) + ROW_BUFFER;

        if (startY + tableHeightOnSlide + rowHeight > CONTENT_HEIGHT) {
            slide.addTable(rowsForCurrentSlide, { x: MARGIN_LEFT, y: startY, w: CONTENT_WIDTH, autoPage: false });

            slide = pptx.addSlide();
            slide.addText(`${slideTitle} (cont.)`, { ...TITLE_OPTIONS, x: MARGIN_LEFT, y: MARGIN_TOP, w: CONTENT_WIDTH });
            startY = MARGIN_TOP + TITLE_OPTIONS.h + 0.15;

            rowsForCurrentSlide = [content.headers.map((h: string) => ({ text: h, options: headerOptions }))];
            tableHeightOnSlide = measureHeight(headerHtml, virtualSlideElement) + ROW_BUFFER;
        }

        rowsForCurrentSlide.push(row.cells.map((c: string) => ({ text: c, options: rowOptions })));
        tableHeightOnSlide += rowHeight;
    }

    if (rowsForCurrentSlide.length > 1) {
        slide.addTable(rowsForCurrentSlide, { 
            x: MARGIN_LEFT, 
            y: startY, 
            w: CONTENT_WIDTH, 
            autoPage: false,
            border: { type: 'solid', color: '888888', pt: 1 } // Add border to the table
        });
    }

    const finalY = startY + tableHeightOnSlide + 0.25;

    return { newY: finalY, slide: slide };
}

/**
 * Generates a PowerPoint presentation from structured slide data.
 * @param {Slide[]} slidesData - An array of slide objects.
 * @param {string} fileName - The desired file name for the presentation.
 */
export async function generatePptx(slidesData: Slide[], fileName: string = 'Generated-Presentation.pptx', virtualSlideElement: HTMLElement) {
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';

    for (const slideData of slidesData) {
        let currentSlide = pptx.addSlide();
        let currentY = MARGIN_TOP;

        currentSlide.addText(slideData.title, {
            ...TITLE_OPTIONS,
            x: MARGIN_LEFT,
            y: currentY,
            w: CONTENT_WIDTH,
        });
        currentY += TITLE_OPTIONS.h;
        currentY += 0.15; // Extra margin after title

        for (const content of slideData.content) {
            currentY += 0.15; // Small buffer between content blocks

            if (currentY >= CONTENT_HEIGHT) {
                currentSlide = pptx.addSlide();
                currentSlide.addText(`${slideData.title} (cont.)`, { ...TITLE_OPTIONS, x: MARGIN_LEFT, y: MARGIN_TOP, w: CONTENT_WIDTH });
                currentY = MARGIN_TOP + TITLE_OPTIONS.h + 0.15;
            }

            switch (content.type) {
                case 'paragraph': {
                    const { newY, slide } = await renderParagraph(pptx, currentSlide, content, currentY, slideData.title, virtualSlideElement);
                    currentY = newY;
                    currentSlide = slide;
                    break;
                }
                case 'bullet_list': {
                    const { newY, slide } = await renderBulletList(pptx, currentSlide, content, currentY, slideData.title, virtualSlideElement);
                    currentY = newY;
                    currentSlide = slide;
                    break;
                }
                case 'numbered_list': {
                    const { newY, slide } = await renderNumberedList(pptx, currentSlide, content, currentY, slideData.title, virtualSlideElement);
                    currentY = newY;
                    currentSlide = slide;
                    break;
                }
                case 'table': {
                    const { newY, slide } = await renderTable(pptx, currentSlide, content, currentY, slideData.title, virtualSlideElement);
                    currentY = newY;
                    currentSlide = slide;
                    break;
                }
                // Add other content types as needed
            }
        }
    }

    return pptx.writeFile({ fileName });
}