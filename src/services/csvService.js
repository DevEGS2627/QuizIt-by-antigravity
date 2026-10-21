// CSV Parser & Generator Service for EGS Quizit!

export const csvService = {
  // Parse incoming CSV text supporting quotes, commas, multiline
  parseCSV(text) {
    const lines = [];
    let currentRow = [];
    let currentCell = '';
    let insideQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          currentCell += '"';
          i++; // skip escaped quote
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if ((char === '\r' || char === '\n') && !insideQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        currentRow.push(currentCell.trim());
        if (currentRow.some(c => c.length > 0)) {
          lines.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += char;
      }
    }

    if (currentCell.length > 0 || currentRow.length > 0) {
      currentRow.push(currentCell.trim());
      if (currentRow.some(c => c.length > 0)) {
        lines.push(currentRow);
      }
    }

    return lines;
  },

  // Import questions from CSV
  importQuestions(csvText) {
    const rows = this.parseCSV(csvText);
    if (rows.length < 2) {
      throw new Error('CSV file is empty or missing headers.');
    }

    const headers = rows[0].map(h => h.toLowerCase().replace(/[\s_-]/g, ''));
    
    // Find column indexes
    const tagIdx = headers.findIndex(h => h.includes('tag'));
    const roundIdx = headers.findIndex(h => h.includes('round'));
    const qIdx = headers.findIndex(h => h.includes('question') || h.includes('text') || h.includes('prompt'));
    const ansIdx = headers.findIndex(h => h.includes('answer') || h.includes('key'));
    const srcIdx = headers.findIndex(h => h.includes('source') || h.includes('ref'));
    const mediaIdx = headers.findIndex(h => h.includes('media') || h.includes('image') || h.includes('url'));

    if (qIdx === -1 || ansIdx === -1) {
      throw new Error('CSV must contain at least "question" and "answer" columns.');
    }

    const imported = [];
    const errors = [];

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0 || !row[qIdx]) continue;

      try {
        let roundNum = roundIdx !== -1 && row[roundIdx] ? parseInt(row[roundIdx].replace(/\D/g, ''), 10) : 1;
        if (isNaN(roundNum) || roundNum < 1 || roundNum > 6) roundNum = 1;

        let tag = tagIdx !== -1 && row[tagIdx] ? row[tagIdx].toUpperCase().trim() : `R${roundNum}-${String(r).padStart(3, '0')}`;
        // Ensure proper format R1-001
        if (!tag.startsWith('R')) {
          tag = `R${roundNum}-${tag}`;
        }

        const question = row[qIdx].trim();
        const answer = row[ansIdx].trim();
        const source = srcIdx !== -1 && row[srcIdx] ? row[srcIdx].trim() : '';
        const mediaUrl = mediaIdx !== -1 && row[mediaIdx] ? row[mediaIdx].trim() : null;

        imported.push({
          id: `q-csv-${Date.now()}-${r}`,
          tag,
          round: roundNum,
          question,
          answer,
          source: source || 'External Import',
          mediaUrl: mediaUrl || null,
          mediaType: mediaUrl ? (mediaUrl.match(/\.(mp4|webm)$/i) ? 'video' : 'image') : null,
          status: 'available',
          importedAt: new Date().toISOString()
        });
      } catch (err) {
        errors.push(`Row ${r + 1}: ${err.message}`);
      }
    }

    return { imported, errors };
  },

  // Export questions to CSV string
  exportQuestions(questions) {
    const headers = ['Tag', 'Round', 'Question', 'Answer', 'Source', 'Media_URL', 'Status'];
    const rows = questions.map(q => [
      q.tag,
      q.round,
      `"${(q.question || '').replace(/"/g, '""')}"`,
      `"${(q.answer || '').replace(/"/g, '""')}"`,
      `"${(q.source || '').replace(/"/g, '""')}"`,
      `"${(q.mediaUrl || '').replace(/"/g, '""')}"`,
      q.status || 'available'
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  },

  // Export live scores & round breakdown to CSV
  exportScores(teams, rounds) {
    const headers = ['Rank', 'Team Name', 'School', ...rounds.map(r => `${r.badge} (${r.name})`), 'Total Score'];
    const sorted = [...teams].sort((a, b) => b.totalScore - a.totalScore);

    const rows = sorted.map((t, idx) => [
      idx + 1,
      `"${t.name.replace(/"/g, '""')}"`,
      `"${(t.school || '').replace(/"/g, '""')}"`,
      ...rounds.map((_, rIdx) => t.scoresByRound[rIdx] || 0),
      t.totalScore
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  },

  // Export Audit / Marks History
  exportHistory(marksHistory, drawHistory) {
    const marksHeaders = ['Timestamp', 'Type', 'Team', 'Points_Delta', 'Question_Tag', 'Round', 'Reason', 'Operator'];
    const marksRows = marksHistory.map(m => [
      m.timestamp,
      m.type,
      `"${(m.teamName || '').replace(/"/g, '""')}"`,
      m.pointsDelta,
      m.questionTag || 'N/A',
      m.round || 'N/A',
      `"${(m.reason || '').replace(/"/g, '""')}"`,
      m.operator || 'Admin'
    ]);

    return [
      '--- MARKS & AUDIT TRAIL ---',
      marksHeaders.join(','),
      ...marksRows.map(r => r.join(',')),
      '',
      '--- DRAW HISTORY ---',
      'Timestamp,Question_Tag,Round,Method,Assigned_Team',
      ...drawHistory.map(d => `${d.timestamp},${d.questionTag},${d.round},${d.method},"${(d.teamName || '').replace(/"/g, '""')}"`)
    ].join('\r\n');
  },

  // Generate Sample CSV Template for user download
  generateSampleTemplate() {
    const headers = ['Tag', 'Round', 'Question', 'Answer', 'Source', 'Media_URL'];
    const sampleRows = [
      ['R1-001', '1', '"What is the capital city of Australia?"', '"Canberra"', '"World Geography"', '""'],
      ['R1-002', '1', '"Which element has the atomic number 1?"', '"Hydrogen"', '"IUPAC Periodic Table"', '""'],
      ['R2-001', '2', '"Which particle is known as the carrier of electromagnetic force?"', '"Photon"', '"Quantum Physics"', '""'],
      ['R3-001', '3', '"In which year did the Apollo 11 moon landing take place?"', '"1969"', '"NASA Historic Archives"', '""']
    ];

    return [headers.join(','), ...sampleRows.map(r => r.join(','))].join('\r\n');
  },

  // Trigger browser file download
  downloadFile(content, filename, type = 'text/csv;charset=utf-8;') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
