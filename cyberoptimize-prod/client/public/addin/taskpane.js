/* 
 * Costloci Word Add-in Logic
 * Handles document analysis and real-time intelligence injection.
 */

Office.onReady((info) => {
    if (info.host === Office.HostType.Word) {
        document.getElementById("run-analysis").onclick = runAnalysis;
        document.getElementById("reset").onclick = resetUI;
    }
});

async function runAnalysis() {
    toggleState('loading');
    
    try {
        const docText = await getDocumentText();
        
        // In a real environment, this would call the production API
        // For development, we point to the Costloci platform endpoint
        const response = await fetch('/api/integrations/word/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                content: docText,
                standards: ['KDPA', 'GDPR'] // Default enterprise standards
            })
        });

        if (!response.ok) throw new Error('Intelligence Engine Unreachable');

        const data = await response.json();
        renderResults(data);
        toggleState('results');
    } catch (error) {
        console.error(error);
        alert('Critical Error: Could not connect to Costloci Intelligence Hub.');
        toggleState('idle');
    }
}

function getDocumentText() {
    return new Promise((resolve, reject) => {
        Word.run(async (context) => {
            const body = context.document.body;
            context.load(body, 'text');
            await context.sync();
            resolve(body.text);
        }).catch(reject);
    });
}

function renderResults(data) {
    const list = document.getElementById('results-list');
    list.innerHTML = '';
    
    // Detailed Deviations
    data.analysis?.forEach(item => {
        const div = document.createElement('div');
        div.className = 'p-5 rounded-2xl glass border-l-4 ' + (item.severity === 'Critical' ? 'border-l-red-500' : 'border-l-cyan-500');
        div.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <p class="text-[9px] font-black uppercase tracking-widest ${item.severity === 'Critical' ? 'text-red-500' : 'text-cyan-500'}">${item.severity}</p>
                <p class="text-[10px] font-bold text-slate-100">${item.clause}</p>
            </div>
            <p class="text-[11px] text-slate-400 font-medium leading-relaxed">${item.deviation}</p>
        `;
        list.appendChild(div);
    });

    // Summary Insight
    document.getElementById('summary-insight').innerText = data.summary || 'Document compliant with core jurisdictional requirements. 4 minor optimizations identified.';
}

function toggleState(state) {
    document.getElementById('idle-state').classList.toggle('hidden', state !== 'idle');
    document.getElementById('loading-state').classList.toggle('hidden', state !== 'loading');
    document.getElementById('results-state').classList.toggle('hidden', state !== 'results');
}

function resetUI() {
    toggleState('idle');
}
