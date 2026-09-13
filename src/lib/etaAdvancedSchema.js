const number = { type: 'number' }, string = { type: 'string' };
const browserKeyframe = { type: 'object', properties: { time:number, content:string, amplitude:number, speed:number, x:number, y:number, z:number, offset:number, scrollY:number, rotate:{type:'boolean'} }, required:['time','content'] };
const zoomKeyframe = { type:'object', properties:{ time:number, selector:string, x:number, y:number, scale:number, duration:number, easing:string }, required:['time','scale','easing'] };
const cursorStep = { type:'object', properties:{ time:number, selector:string, duration:number, action:string }, required:['time','selector','duration','action'] };
const textKeyframe = { type:'object', properties:{ time:number, opacity:number, scale:number }, required:['time','opacity','scale'] };
const ringKeyframe = { type:'object', properties:{ time:number, speed:number, radius:number, tiltX:number, tiltZ:number, textDepth:number, easing:string }, required:['time','speed','radius','tiltX','tiltZ','textDepth','easing'] };
const haloMoveKeyframe = { type:'object', properties:{ time:number, x:number, y:number, z:number, easing:string }, required:['time','x','y','z','easing'] };
const cardZoomKeyframe = { type:'object', properties:{ time:number, focusCard:number, zoomOut:{type:'boolean'}, x:number, y:number, easing:string }, required:['time','focusCard','zoomOut','x','y','easing'] };
const cutSide = { type:'object', properties:{ duration:number, distance:number, drift:number, driftDuration:number, curve:string, ratio:string, opacity:number, scale:number, easing:string, direction:string } };
const matchCut = { type:'object', properties:{ enabled:{type:'boolean'}, direction:string, outgoing:cutSide, incoming:cutSide }, required:['enabled','direction','outgoing','incoming'] };

export const etaAdvancedSchema = { type:'object', properties:{
  subtitle:string, searchText:string, url:string, pageTitle:string, pageSubtitle:string, ctaLabel:string, browserRows:{type:'array',items:string},
  browserKeyframes:{type:'array',items:browserKeyframe}, zoomKeyframes:{type:'array',items:zoomKeyframe}, cursorSteps:{type:'array',items:cursorStep}, textKeyframes:{type:'array',items:textKeyframe}, ringKeyframes:{type:'array',items:ringKeyframe}, haloMoveKeyframes:{type:'array',items:haloMoveKeyframe}, cardZoomKeyframes:{type:'array',items:cardZoomKeyframe}, matchCut,
  animatedBorder:{type:'boolean'}, showShell:{type:'boolean'}, backgroundColor:string, boxShadow:string, pillBackground:string, pillTextColor:string,
  textContent:string, fontSize:string, fontWeight:number, fontFamily:string, textColor:string, zIndex:number, textLeft:number, framesPerCharacter:number,
  phoneModel:string, centerHeadline:string, cardColor:string, cardFont:string, cardFontSize:number, cardFontWeight:number, cardTextDepth:number, cardRadius:number, cardWidth:number, cardHeight:number, textTransform:string,
  spinPeriodFrames:number, spinSpeed:number, sphereRadius:number, sphereTiltX:number, sphereTiltZ:number, headlineOrbitRadius:number, headlineOrbitSpeed:number, headlineOrbitIncline:number, spinDirection:string, cardPerspective:number, satelliteX:number, satelliteY:number, satelliteZ:number, satelliteRotateX:number, satelliteRotateY:number, satelliteRotateZ:number, spinPhase:number,
  haloX:number, haloY:number, haloZ:number, depthStrength:number, maxBlur:number, centerTextColor:string, centerDriftStrength:number, centerDriftMin:number, centerDriftMax:number, haloBaseX:number, haloBaseY:number, haloBaseZ:number, floatRotation:number, floatSpeed:number
} };