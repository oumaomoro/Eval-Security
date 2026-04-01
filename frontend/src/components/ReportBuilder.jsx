import React, { useState, useEffect } from 'react';
import { ResponsiveGridLayout, useContainerWidth } from 'react-grid-layout';
import { LayoutDashboard, Save, Plus, Trash2, Maximize2, BarChart2, Shield, DollarSign } from 'lucide-react';
import { supabase } from '../contexts/AuthContext';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const WIDGET_TYPES = [
  { id: 'risk_summary', label: 'Risk Heatmap', icon: Shield, minW: 2, minH: 2 },
  { id: 'contract_value', label: 'Total Contract Value', icon: DollarSign, minW: 1, minH: 1 },
  { id: 'compliance_radar', label: 'Compliance Radar', icon: BarChart2, minW: 2, minH: 2 },
  { id: 'vendor_list', label: 'Top High-Risk Vendors', icon: LayoutDashboard, minW: 2, minH: 2 },
];

export default function ReportBuilder({ templateId, onSave }) {
  const [layout, setLayout] = useState([]);
  const [widgets, setWidgets] = useState([]);
  const [saving, setSaving] = useState(false);
  const { width, containerRef, mounted } = useContainerWidth();

  useEffect(() => {
    if (templateId) {
      loadTemplate();
    }
  }, [templateId]);

  const loadTemplate = async () => {
    const { data: report } = await supabase
      .from('reports')
      .select('scope')
      .eq('id', templateId)
      .single();
    
    if (report?.scope) {
      setLayout(report.scope.layout || []);
      setWidgets(report.scope.widgets || []);
    }
  };

  const addWidget = (type) => {
    const id = `widget-${Date.now()}`;
    const newWidget = { id, type: type.id, label: type.label };
    const newLayoutItem = { 
      i: id, 
      x: (layout.length * 2) % 12, 
      y: Infinity, 
      w: type.minW, 
      h: type.minH 
    };

    setWidgets([...widgets, newWidget]);
    setLayout([...layout, newLayoutItem]);
  };

  const removeWidget = (id) => {
    setWidgets(widgets.filter(w => w.id !== id));
    setLayout(layout.filter(l => l.i !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const scope = { layout, widgets };
      onSave(scope);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* Sidebar: Widget Picker */}
      <div className="w-64 border-r border-slate-800 bg-slate-900 p-6 flex flex-col gap-6">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 text-center">Available Widgets</h3>
          <div className="space-y-2">
            {WIDGET_TYPES.map(type => (
              <button
                key={type.id}
                onClick={() => addWidget(type)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-white/5 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all text-sm group"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center group-hover:text-cyan-400">
                  <type.icon size={16} />
                </div>
                {type.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all font-inter"
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 overflow-y-auto p-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Report Designer</h2>
              <p className="text-sm text-slate-400 mt-1 font-inter">Drag and resize widgets to create your intelligence dashboard.</p>
            </div>
            <div className="flex gap-4">
               {/* Controls if needed */}
            </div>
          </div>

          <div ref={containerRef} className="w-full">
            {mounted && (
              <ResponsiveGridLayout
                className="layout"
                layouts={{ lg: layout }}
                breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                rowHeight={100}
                width={width}
                onLayoutChange={(currentLayout) => setLayout(currentLayout)}
                draggableHandle=".widget-handle"
              >
                {widgets.map(widget => (
                  <div key={widget.id} className="group relative bg-slate-900 border border-white/5 rounded-2xl shadow-xl overflow-hidden backdrop-blur-xl">
                    <div className="widget-handle absolute top-0 left-0 right-0 h-10 flex items-center justify-between px-4 bg-slate-800/80 cursor-move opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{widget.label}</span>
                      <button onClick={() => removeWidget(widget.id)} className="p-1 hover:text-rose-400">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-3 pt-4">
                       <div className="w-16 h-16 rounded-full bg-slate-800/50 border border-white/5 flex items-center justify-center">
                         {WIDGET_TYPES.find(t => t.id === widget.type)?.icon({ size: 24 })}
                       </div>
                       <p className="text-xs font-inter font-medium uppercase tracking-tight">Live Preview Pending</p>
                    </div>
                  </div>
                ))}
              </ResponsiveGridLayout>
            )}
          </div>
          
          {widgets.length === 0 && (
            <div className="h-[500px] border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center text-slate-600 gap-4">
              <Maximize2 size={48} className="opacity-20 translate-y-2" />
              <p className="text-lg font-bold font-inter text-slate-400">Your canvas is empty.</p>
              <p className="text-sm max-w-xs text-center opacity-70">Add widgets from the sidebar to start building your custom executive report.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
