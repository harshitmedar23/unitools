# 09 Progress (Copilot: update this after every task)

## Steps
- [ ] 0 Setup
- [x] 1 Skeleton (index, style.css, common.js, icons, tools.json, Pages live)
- [ ] 2 First 3 tools
- [ ] 3 Feedback round
- [ ] 4 Finish Phase 1
- [ ] 5 Polish (privacy, sitemap, _headers, titles)
- [ ] 6 Sharing backend
- [ ] 7 Phase 2 tools
- [x] 8 Phase 3 tools

## Tools (tick when it passes brain/07)
### Phase 1
- [x] 1 Merge PDF
- [x] 2 Split PDF
- [x] 3 JPG to PDF
- [x] 4 PDF to JPG
- [x] 5 Compress image
- [x] 6 Resize image
- [x] 7 QR code generator
- [x] 8 Clean AI code
### Phase 2
- [ ] 9 Quick share
- [ ] 10 Link share
- [ ] 11 Receive file
- [x] 12 Compress PDF
- [x] 13 Image converter
- [x] 14 Word and character counter
- [x] 15 Password generator
- [x] Rotate PDF pages
- [x] Reorder, extract or delete PDF pages
- [x] Add page numbers to PDF
- [x] Add watermarks to PDF
- [x] Add PDF headers and footers
- [x] Edit PDF metadata
- [x] Compare two PDFs by page count and extractable text
- [x] Extract text from PDFs
- [x] Extract embedded images from PDFs
- [x] Add signature images to PDFs
- [x] Generate PDF page thumbnail contact sheets
- [x] Crop PDF page edges
- [x] Fill standard PDF text, checkbox, dropdown and radio fields
- [x] Export selectable PDF text as Markdown
### Phase 3
- [x] 16 Age calculator
- [x] 17 Percentage calculator
- [x] 18 EMI calculator
- [x] 19 GST calculator
- [x] 20 CGPA / SGPA calculator
- [x] 21 Attendance calculator
- [x] 22 JSON formatter
- [x] 23 Base64 encode / decode
### Phase 4 (local conversions)
- [x] TXT to PDF
- [x] HTML to PDF (browser print / Save as PDF)
- [x] Markdown to HTML
- [x] Markdown to PDF
- [x] JSON to CSV
- [x] CSV to JSON
- [x] XML to JSON
- [x] JSON to XML
- [x] Batch conversion for TXT, Markdown, JSON, CSV and XML
- [x] CSV to XLSX
- [x] XLSX to CSV (first worksheet)

## Open decisions and notes
(Add anything undecided or learned here, one line each.)
- Sharing tools are hidden from public/assets/tools.json until the Worker has real R2/KV bindings and passes deployed API tests.
- Password-protect PDF is not listed: the vendored pdf-lib version can read and rewrite PDFs but cannot create encrypted output safely in the browser.
- CSV to XLSX and XLSX to CSV use the locally vendored SheetJS 0.18.5 build and convert only in the browser.
- DOCX, PPTX, EPUB and OCR conversions are not listed: no local browser libraries are vendored for reliable output.
- HTML to PDF uses the browser print dialog and asks the user to choose Save as PDF; it does not claim to render HTML through pdf-lib.
- The public PDF directory groups implemented operations and marks unsupported items as unavailable. OCR, PDF repair, PDF encryption/decryption, Word/PowerPoint/Excel conversion, PDF/A conversion, redaction, AI summaries and translation need additional engines or services and must not be advertised as working.
- PDF page recovery stalled during local PDF.js rendering validation, and authorized password removal has no encrypted test fixture; both remain unlisted until independently verified.
