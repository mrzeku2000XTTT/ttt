import React from 'react';
import BackToStore from '@/components/BackToStore';
import useAngleEditor from '@/components/uiangle/useAngleEditor';
import useAngleActions from '@/components/uiangle/useAngleActions';
import AngleEditorHeader from '@/components/uiangle/AngleEditorHeader';
import AngleLayers from '@/components/uiangle/AngleLayers';
import AngleViewport from '@/components/uiangle/AngleViewport';
import AngleScene2D from '@/components/uiangle/AngleScene2D';
import AngleSceneMap from '@/components/uiangle/AngleSceneMap';
import AngleCameraInspector from '@/components/uiangle/AngleCameraInspector';
import AngleSubjectInspector from '@/components/uiangle/AngleSubjectInspector';
import AngleGeneratePanel from '@/components/uiangle/AngleGeneratePanel';
import AngleMotionBar from '@/components/uiangle/AngleMotionBar';
import AngleResultDialog from '@/components/uiangle/AngleResultDialog';
export default function AngleWorkspace() {
  const e=useAngleEditor(),a=useAngleActions(e),flat=e.mode==='2d';
  return <div className="angle-editor flex min-h-dvh flex-col bg-background text-foreground lg:h-dvh lg:overflow-hidden"><BackToStore/><AngleEditorHeader editor={e} actions={a}/>
    <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[200px_minmax(0,1fr)_280px] xl:grid-cols-[220px_minmax(0,1fr)_296px]">
      <fieldset disabled={!!a.busy||e.playing} className="min-w-0 lg:overflow-y-auto"><AngleLayers editor={e}/></fieldset>
      <main className="flex min-w-0 flex-col lg:min-h-0">
        <div className="flex min-h-12 items-center justify-between gap-2 border-b border-border px-4 text-xs"><span className="font-medium">{flat?'Composition canvas':'3D workspace'}</span><span className="text-[10px] text-muted-foreground">{e.selected==='camera'?'Camera selected':e.subjects.find(s=>s.id===e.selected)?.label} / {flat?'Place & frame':'Orbit & block'}</span></div>
        <div className={`relative min-h-[420px] flex-1 lg:min-h-0 ${a.busy||e.playing?'pointer-events-none':''}`}>{flat?<AngleScene2D editor={e}/>:<AngleViewport editor={e}/>}</div>
        <AngleMotionBar editor={e}/>
        <div className="grid shrink-0 grid-cols-1 border-t border-border bg-card sm:grid-cols-[minmax(0,1fr)_220px]">
          <div className="min-w-0 p-3"><div className="mb-2 flex justify-between text-[10px] uppercase tracking-[.16em] text-muted-foreground"><span>Camera view</span><span>{flat?'2D frame':'Live render'} / 16:9</span></div><div className="mx-auto max-w-[360px] overflow-hidden rounded-lg border border-border">{flat?<AngleScene2D editor={e} preview/>:<AngleViewport editor={e} preview captureRef={e.captureRef}/>}</div></div>
          {flat?<div className="flex items-center border-l border-border px-5 py-4 text-xs leading-relaxed text-muted-foreground">The dashed camera frame is your output. Move it, zoom in, or roll the camera to compose the shot.</div>:<div className={`border-l border-border ${a.busy?'pointer-events-none':''}`}><AngleSceneMap editor={e}/></div>}
        </div>
      </main>
      <fieldset disabled={!!a.busy} className="min-w-0 border-l border-border bg-card lg:overflow-y-auto"><AngleSubjectInspector editor={e}/><AngleCameraInspector editor={e}/><AngleGeneratePanel editor={e} actions={a}/></fieldset>
    </div><AngleResultDialog actions={a}/>
  </div>;
}