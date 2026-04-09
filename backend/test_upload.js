import fs from 'fs';
import path from 'path';

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjQzYTM4OWJlLTcyYzctNDYwNC05ZTFhLTEwMzNlZWFjMjVjYTU1IiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwicm9sZSI6ImFkbWluIiwidGllciI6ImVudGVycHJpc2UiLCJpYXQiOjE3NDM1Mzc3ODMsImV4cCI6MTc0NDE0MjU4M30.4Nnsv4VTJWd9UNfJa937Y4HAjOWeew75RPG5Zj8';
const filePath = 'c:\\Users\\Jack.Ouma\\Downloads\\New folder\\Costloci\\Costloci\\Costloci-prod\\test_agreement.pdf';

async function testUpload() {
    console.log('--- Starting System Stress Test (Contract Ingestion) ---');

    // Use a simple fetch-like approach with form-data
    const formData = new FormData();
    const fileBuffer = fs.readFileSync(filePath);
    const blob = new Blob([fileBuffer], { type: 'application/pdf' });
    formData.append('file', blob, 'test_agreement.pdf');

    try {
        const response = await fetch('http://localhost:3001/api/contracts/analyze', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        const result = await response.json();
        console.log('--- Analysis Results Received ---');
        console.log('Status:', response.status);
        console.log('Success:', result.success);

        if (result.success) {
            const contract = result.data;
            console.log('Vendor Name:', contract.vendor_name);
            console.log('Detected Sector:', contract.detected_sector);
            console.log('Detected Jurisdiction:', contract.detected_jurisdiction);
            console.log('Compliance Score:', contract.ai_analysis?.compliance_readiness);

            const findings = contract.ai_analysis?.categorized_findings || [];
            console.log('Findings Count:', findings.length);

            const firstFinding = findings[0] || {};
            console.log('First Finding alignment:', !!firstFinding.gold_standard_alignment);
            if (firstFinding.gold_standard_alignment) {
                console.log('Match Standard:', firstFinding.gold_standard_alignment.standard);
                console.log('Gap Analysis:', firstFinding.gold_standard_alignment.gap_analysis);
            }
        } else {
            console.error('Error Details:', JSON.stringify(result, null, 2));
        }
    } catch (err) {
        console.error('Fatal Upload Error:', err.message);
    }
}

testUpload();
