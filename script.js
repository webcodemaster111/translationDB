document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('generateButton').addEventListener('click', generateTranslationMemory);
});

function readFile(file, callback) {
    const reader = new FileReader();
    reader.onload = function(event) {
        callback(event.target.result);
    };
    reader.readAsArrayBuffer(file);
}

function parseHTMLContent(content) {
    const decoder = new TextDecoder('utf-8');
    const decodedContent = decoder.decode(content);
    const parser = new DOMParser();
    const doc = parser.parseFromString(decodedContent, 'text/html');
    return doc.body.innerText.trim().split('\n');
}

function parseXLSXContent(content) {
    const workbook = XLSX.read(content, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(sheet, { header: 1 }).flat();
}

function parseDITAContent(content) {
    const decoder = new TextDecoder('utf-8');
    const decodedContent = decoder.decode(content);
    const parser = new DOMParser();
    const doc = parser.parseFromString(decodedContent, 'application/xml');
    const texts = Array.from(doc.querySelectorAll('p')).map(p => p.textContent.trim().split('\n')).flat();
    return texts;
}

function generateTranslationMemory() {
    const koreanFile = document.getElementById('koreanFile').files[0];
    const englishFile = document.getElementById('englishFile').files[0];

    if (!koreanFile || !englishFile) {
        alert('Please upload both Korean and English files.');
        return;
    }

    const koreanFileType = koreanFile.name.split('.').pop();
    const englishFileType = englishFile.name.split('.').pop();

    let koreanContent, englishContent;

    const processFiles = () => {
        if (koreanContent && englishContent) {
            if (koreanContent.length !== englishContent.length) {
                alert('The number of lines in Korean and English texts must be the same.');
                return;
            }

            const translationMemory = koreanContent.map((korean, index) => [korean, englishContent[index]]);
            const worksheet = XLSX.utils.aoa_to_sheet([['Korean', 'English'], ...translationMemory]);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Translation Memory');
            const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'binary' });

            const blob = new Blob([s2ab(wbout)], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            const downloadButton = document.getElementById('downloadButton');
            downloadButton.style.display = 'block';
            downloadButton.onclick = () => {
                const a = document.createElement('a');
                a.href = url;
                a.download = 'translation_memory.xlsx';
                a.click();
                URL.revokeObjectURL(url);
            };
        }
    };

    if (koreanFileType === 'html') {
        readFile(koreanFile, content => {
            koreanContent = parseHTMLContent(content);
            console.log('Korean content parsed:', koreanContent);
            processFiles();
        });
    } else if (koreanFileType === 'xlsx') {
        readFile(koreanFile, content => {
            koreanContent = parseXLSXContent(content);
            console.log('Korean content parsed:', koreanContent);
            processFiles();
        });
    } else if (koreanFileType === 'dita') {
        readFile(koreanFile, content => {
            koreanContent = parseDITAContent(content);
            console.log('Korean content parsed:', koreanContent);
            processFiles();
        });
    }

    if (englishFileType === 'html') {
        readFile(englishFile, content => {
            englishContent = parseHTMLContent(content);
            console.log('English content parsed:', englishContent);
            processFiles();
        });
    } else if (englishFileType === 'xlsx') {
        readFile(englishFile, content => {
            englishContent = parseXLSXContent(content);
            console.log('English content parsed:', englishContent);
            processFiles();
        });
    } else if (englishFileType === 'dita') {
        readFile(englishFile, content => {
            englishContent = parseDITAContent(content);
            console.log('English content parsed:', englishContent);
            processFiles();
        });
    }
}

function s2ab(s) {
    const buf = new ArrayBuffer(s.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < s.length; i++) {
        view[i] = s.charCodeAt(i) & 0xFF;
    }
    return buf;
}
