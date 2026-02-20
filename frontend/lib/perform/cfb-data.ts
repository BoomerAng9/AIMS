import fs from 'fs';
import path from 'path';

export interface CollegeInfo {
    school: string;
    mascot: string;
    city: string;
    state: string;
    conference: string;
}

let cfbTeamsCache: Record<string, CollegeInfo> | null = null;

export function getCollegeInfo(collegeName: string): CollegeInfo | null {
    if (!cfbTeamsCache) {
        try {
            // Assuming process.cwd() is A.I.M.S/frontend
            // and docs is at A.I.M.S/docs
            const csvPath = path.join(
                process.cwd(),
                '..',
                'docs',
                'Training_Data',
                'cfb-data',
                'automated',
                'wiki',
                'team',
                'team.csv'
            );

            if (!fs.existsSync(csvPath)) {
                console.warn('[CFB Data] team.csv not found at:', csvPath);
                cfbTeamsCache = {}; // empty cache so we don't spam errors
                return null;
            }

            const csvData = fs.readFileSync(csvPath, 'utf8');
            cfbTeamsCache = {};

            const lines = csvData.split('\n');
            for (const line of lines) {
                if (!line.trim()) continue;

                // Simple CSV parse handling potential quotes roughly.
                // It's a pragmatic MVP split approach.
                let row = [];
                let cur = '';
                let inQuotes = false;

                for (let i = 0; i < line.length; i++) {
                    if (line[i] === '"') {
                        inQuotes = !inQuotes;
                    } else if (line[i] === ',' && !inQuotes) {
                        row.push(cur.trim());
                        cur = '';
                    } else {
                        cur += line[i];
                    }
                }
                row.push(cur.trim()); // push last col

                if (row.length >= 5) {
                    const school = row[0];
                    cfbTeamsCache[school.toLowerCase()] = {
                        school,
                        mascot: row[1],
                        city: row[2].replace(/[\[\]']/g, ''), // clean up "[u'Storrs', u'[2]']" messes
                        state: row[3],
                        conference: row[4].replace(/[\[\]']/g, ''),
                    };
                }
            }
        } catch (err) {
            console.error('[CFB Data] Failed to parse team.csv:', err);
            cfbTeamsCache = {}; // Ensure fail-fast behavior
            return null;
        }
    }

    // Very rudimentary fuzzy matching support (e.g. "Miami" -> "Miami (FL)")
    const lowerName = collegeName.toLowerCase();
    if (cfbTeamsCache[lowerName]) {
        return cfbTeamsCache[lowerName];
    }

    // Fallback brute force partial match if exact fails
    for (const [key, info] of Object.entries(cfbTeamsCache)) {
        if (key.includes(lowerName) || lowerName.includes(key)) {
            return info;
        }
    }

    return null;
}
