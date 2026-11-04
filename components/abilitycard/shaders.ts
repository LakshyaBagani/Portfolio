/* =====================================================================
   shaders.ts — GLSL for the ability card. Everything renders in linear
   light into a half-float buffer; FINISH tone-maps it at the end.
   ===================================================================== */

/** noise, colour and the studio the card is lit by: shared by every card material */
export const COMMON = /* glsl */ `
uniform float uTime, uFire, uGlare, uFoil, uHover;
uniform vec3 uLightDir;          // world space, toward the glare light
uniform mat3 uRootRot;           // the card's orientation
float hash12(vec2 p){ vec3 q=fract(vec3(p.xyx)*.1031); q+=dot(q,q.yzx+33.33); return fract((q.x+q.y)*q.z); }
vec2 hash22(vec2 p){ vec3 q=fract(vec3(p.xyx)*vec3(.1031,.1030,.0973)); q+=dot(q,q.yzx+33.33); return fract((q.xx+q.yz)*q.zy); }
float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash12(i),hash12(i+vec2(1,0)),f.x),mix(hash12(i+vec2(0,1)),hash12(i+vec2(1,1)),f.x),f.y); }
float fbm(vec2 p){ float s=0., a=.5; for(int i=0;i<5;i++){ s+=a*vnoise(p); p=p*2.03+vec2(17.3,9.1); a*=.5; } return s; }
vec3 mod289(vec3 x){ return x-floor(x*(1./289.))*289.; }
vec2 mod289(vec2 x){ return x-floor(x*(1./289.))*289.; }
vec3 permute(vec3 x){ return mod289(((x*34.)+1.)*x); }
float snoise(vec2 v){
  const vec4 C=vec4(.211324865405187,.366025403784439,-.577350269189626,.024390243902439);
  vec2 i=floor(v+dot(v,C.yy)); vec2 x0=v-i+dot(i,C.xx);
  vec2 i1=(x0.x>x0.y)?vec2(1.,0.):vec2(0.,1.);
  vec4 x12=x0.xyxy+C.xxzz; x12.xy-=i1;
  i=mod289(i);
  vec3 p=permute(permute(i.y+vec3(0.,i1.y,1.))+i.x+vec3(0.,i1.x,1.));
  vec3 m=max(.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.);
  m=m*m; m=m*m;
  vec3 x=2.*fract(p*C.www)-1.; vec3 h=abs(x)-.5; vec3 ox=floor(x+.5); vec3 a0=x-ox;
  m*=1.79284291400159-.85373472095314*(a0*a0+h*h);
  vec3 g; g.x=a0.x*x0.x+h.x*x0.y; g.yz=a0.yz*x12.xz+h.yz*x12.yw;
  return 130.*dot(m,g);
}
float sfbm(vec2 p){ float s=0., a=.5; for(int i=0;i<5;i++){ s+=a*snoise(p); p=p*2.02+vec2(13.1,7.7); a*=.5; } return s; }
vec2 warp(vec2 p,float t){ return p+.6*vec2(sfbm(p*.9+vec2(0.,t)),sfbm(p*.9+vec2(5.2,1.3-t))); }
vec3 hue(float t){ return clamp(abs(fract(t+vec3(0.,2./3.,1./3.))*6.-3.)-1.,0.,1.); }
vec3 holo(float t){ return mix(hue(t),vec3(1.),.22); }
vec3 axisT(){ return normalize(uRootRot*vec3(1.,0.,0.)); }
vec3 axisB(){ return normalize(uRootRot*vec3(0.,-1.,0.)); }
vec3 axisN(){ return normalize(uRootRot*vec3(0.,0.,1.)); }
// the studio: a dark floor, warm bounce from a fire low on the left, a cool rim on the right,
// and the softbox that follows the pointer
vec3 studio(vec3 R){
  vec3 c=mix(vec3(.012,.010,.009),vec3(.075,.062,.05),smoothstep(-.4,.7,R.y));
  c+=vec3(1.,.42,.12)*.30*uFire*pow(max(dot(R,normalize(vec3(-.45,-.65,.6))),0.),4.);
  c+=vec3(.55,.62,.78)*.22*pow(max(dot(R,normalize(vec3(.85,.35,.35))),0.),6.);
  float l=max(dot(R,uLightDir),0.);
  c+=vec3(1.,.94,.84)*(2.4*pow(l,48.)+.16*pow(l,8.))*uGlare;
  return c;
}
// one prismatic band that crosses the whole card as it turns, evaluated in card uv by every layer
float sweepX(vec2 cardUv,vec3 V){
  vec2 v2=vec2(dot(V,axisT()),dot(V,axisB()));
  vec2 l2=vec2(dot(uLightDir,axisT()),dot(uLightDir,axisB()));
  return dot(cardUv-.5,vec2(.85,-.53))-(v2.x*1.35-v2.y*.9+l2.x*.45);
}
float sweepBand(float x,float w){ return exp(-x*x/(w*w)); }
// metal flakes: one per cell at most, each tilted at random; it flashes when its normal meets the light
vec3 glitter(vec2 p,vec3 N,vec3 V,vec3 T,vec3 B,float density,float power){
  vec2 id=floor(p), f=fract(p);
  float on=step(1.-density,hash12(id+7.7));
  float flake=smoothstep(.32,.0,length(f-(.25+.5*hash22(id))));
  vec2 tilt=(hash22(id+3.3)-.5)*.9;
  vec3 fn=normalize(N+T*tilt.x+B*tilt.y);
  float s=pow(max(dot(fn,normalize(uLightDir+V)),0.),power);
  return holo(hash12(id+1.9))*mix(.5,1.,hash12(id))*s*flake*on;
}
`;

/**
 * the burn reveal: a sphere grows from behind the card (R = K t^e). Ahead of it the card is dark; behind it
 * the card fades up, and each layer's line work (its "wire") burns white-gold at the front and cools to embers.
 */
export const SCAN = /* glsl */ `
uniform vec4 uScanC;             // xyz origin (world), w K
uniform vec4 uScanQ;             // x e, y seconds since the pulse began, z hide ahead, w on
uniform vec3 uCardO;             // the card's centre (world)
vec3 scanP(vec3 wp){ vec3 N=normalize(uRootRot*vec3(0.,0.,1.)); return wp-N*dot(wp-uCardO,N); }   // depth flattened onto the card
float iso(float v,float k){ float w=fwidth(v); return (1.-clamp(abs(v-k)/max(w,1e-6),0.,1.))*(1.-smoothstep(.12,.3,w))*step(1e-5,w); }
float hairC(float x){ float w=fwidth(x); float f=abs(fract(x+.5)-.5); return (1.-clamp(f/max(w,1e-6),0.,1.))*(1.-smoothstep(.09,.2,w))*step(1e-5,w); }
vec3 fireC(float k){ return mix(mix(vec3(.30,.025,.004),vec3(1.,.30,.035),smoothstep(0.,.45,k)),vec3(1.,.86,.56),smoothstep(.55,1.,k)); }
float scanDist(vec3 wp){
  float D=length(scanP(wp)-uScanC.xyz);
  return D+(vnoise(wp.xy*1.6+vec2(0.,-uTime*.8))-.5)*.12;
}
float scanAge(vec3 wp){
  float D=scanDist(wp)+(vnoise(wp.xy*6.+uTime*1.3)-.5)*.03;
  return uScanQ.y-pow(max(D,0.)/uScanC.w,1./uScanQ.x);
}
float scanLit(vec3 wp){ return uScanQ.w<.5 ? 1. : mix(1.,smoothstep(.1,.95,scanAge(wp)),uScanQ.z); }
vec3 scanCard(vec3 c,vec3 wp,float wire){
  if(uScanQ.w<.5) return c;
  float age=scanAge(wp);
  float R=uScanC.w*pow(max(uScanQ.y,0.),uScanQ.x);
  float dd=scanDist(wp)-R;                                                    // > 0 ahead of the front
  vec3 o=c*mix(1.,smoothstep(.1,.95,age),uScanQ.z);
  float px=max(fwidth(dd),1e-5), q=dd/px, near=step(abs(dd),.12);            // the front: a white-hot core, an orange edge
  o+=(fireC(1.)*exp(-q*q*1.6)*1.1+fireC(.62)*exp(-q*q*.35)*.5)*near+fireC(.32)*exp(-max(-dd,0.)*4.)*step(dd,0.)*.12;
  o+=fireC(.72)*exp(-max(-dd,0.)*14.)*step(dd,0.)*.22;                     // the band just behind it, still hot
  float wv=step(0.,age)*exp(-age*1.8);
  o+=fireC(clamp(1.-pow(max(age,0.),.6)*1.15,0.,1.))*wire*wv*1.1;             // the wire: white-hot, orange, ember, gone
  vec2 cq=wp.xy*9.+vec2(0.,-uTime*1.2); vec2 id=floor(cq); float h1=hash12(id+3.);
  float sp=step(.975,h1)*smoothstep(.3,.05,length(fract(cq)-.5-(hash22(id)-.5)*.4));
  o+=fireC(.5+.25*h1)*sp*step(0.,age)*exp(-age*2.5)*(.55+.45*sin(uTime*23.+h1*60.))*1.6;   // embers on the surface
  return o;
}
`;

export const VERT = /* glsl */ `
varying vec2 vUv; varying vec3 vWPos;
void main(){
  #ifdef CAP_UV
  vUv=uv;
  #else
  vUv=vec2(uv.x,1.-uv.y);
  #endif
  vec4 w=modelMatrix*vec4(position,1.);
  vWPos=w.xyz;
  gl_Position=projectionMatrix*viewMatrix*w;
}`;

/** writes the window into the stencil: only there do the layers behind the card show */
export const MASK_FRAG = /* glsl */ `
uniform sampler2D tFrame; varying vec2 vUv;
void main(){ if(texture2D(tFrame,vUv).a>.5) discard; gl_FragColor=vec4(0.); }`;

/** the window's background painting, with heat shimmer and the warm light breathing */
export const BG_FRAG = /* glsl */ `
uniform sampler2D tBg; uniform vec2 uKiln, uFireBg, uAsp;
varying vec2 vUv; varying vec3 vWPos;
void main(){
  vec2 uv=vUv;
  float up=uFireBg.y-uv.y, dx=uv.x-uFireBg.x;
  float haze=exp(-dx*dx*160.)*smoothstep(0.,.05,up)*smoothstep(.34,.08,up);
  vec2 kd=(uv-uKiln)*uAsp; haze+=exp(-dot(kd,kd)*300.)*.35;
  vec2 hq=uv*vec2(34.,22.)+vec2(0.,uTime*2.1);
  uv+=vec2(snoise(hq),snoise(hq+vec2(7.1,3.7)))*.0042*haze*(.6+.6*uFire);
  vec3 col=texture2D(tBg,uv).rgb;
  float kiln=.5+.5*sin(uTime*.9)+.2*vnoise(vec2(uTime*.7,3.));
  col+=vec3(1.,.36,.08)*exp(-dot(kd,kd)*260.)*(.18+.22*kiln);
  vec2 df=(vUv-uFireBg)*uAsp;
  col+=col*vec3(1.,.36,.07)*exp(-dot(df,df)*38.)*.55*uFire;               // firelight
  float lum=dot(col,vec3(.3,.55,.15));
  col=scanCard(col,vWPos,hairC(lum*26.+vUv.y*3.+.37)*.9);                  // its wire: contour lines of its own light
  gl_FragColor=vec4(col,1.);
}`;

export const FOGF_FRAG = /* glsl */ `
varying vec2 vUv;
void main(){
  vec2 p=vUv*vec2(1.6,2.4);
  float t=uTime;
  vec2 q=warp(p+vec2(t*.028,-t*.009),t*.045);
  float f=sfbm(q)*.5+.5;
  float wisp=1.-abs(sfbm(q*1.8+vec2(3.3,t*.02)));
  gl_FragColor=vec4(mix(f,wisp,.38),0.,0.,1.);
}`;

export const FOG_FRAG = /* glsl */ `
uniform float uNear; uniform vec2 uFireCard; uniform sampler2D tFogF;
varying vec2 vUv; varying vec3 vWPos;
void main(){
  float band=uNear>.5 ? smoothstep(.52,.80,vUv.y)*smoothstep(1.02,.84,vUv.y)
                      : smoothstep(.05,.35,vUv.y)*smoothstep(.95,.55,vUv.y);
  if(band<=0.) discard;
  float f=texture2D(tFogF,vUv).r;
  float a=smoothstep(.42,.85,f)*band*(uNear>.5?.55:.30);
  vec2 d=(vUv-uFireCard)*vec2(1.,1.397);
  vec3 col=mix(vec3(.30,.28,.27),vec3(.95,.45,.16),exp(-dot(d,d)*22.)*uFire);
  gl_FragColor=vec4(col,a*scanLit(vWPos));
}`;

/** the window's inner shadow: falls away from the light */
export const RIM_FRAG = /* glsl */ `
uniform vec4 uWin; varying vec2 vUv; varying vec3 vWPos;
void main(){
  vec2 l2=vec2(dot(uLightDir,axisT()),dot(uLightDir,axisB()));
  vec2 p=vUv+l2*.02;
  float d=min(min(p.x-uWin.x,uWin.y-p.x)*1000.,min(p.y-uWin.z,uWin.w-p.y)*1396.8);   // k units from the window's edge
  float s=exp(-max(d,0.)/16.)*.95;
  gl_FragColor=vec4(0.,0.,0.,pow(s,1.4)*.80*scanLit(vWPos));
}`;

/** the holographic laminate over the window: a sunburst grating, the sweep, and glitter */
export const LAMINATE_FRAG = /* glsl */ `
uniform sampler2D tFrame; varying vec2 vUv; varying vec3 vWPos;
void main(){
  float win=1.-texture2D(tFrame,vUv).a;
  if(win<.01) discard;
  vec3 T=axisT(),B=axisB(),N=axisN();
  vec3 V=normalize(cameraPosition-vWPos);
  vec2 v2=vec2(dot(V,T),dot(V,B)), l2=vec2(dot(uLightDir,T),dot(uLightDir,B));
  vec2 d=(vUv-vec2(.5,.330))*vec2(1.,1.397);
  float ang=atan(d.y,d.x), rad=length(d);
  vec2 g=vec2(cos(ang),sin(ang));
  vec2 h=v2+l2;                                   // zero at the mirror angle
  float mirror=exp(-dot(h,h)*7.);
  float rays=pow(.5+.5*cos(ang*90.),2.);
  float grain=vnoise(vUv*vec2(360.,540.));
  float dust=pow(vnoise(vUv*vec2(1100.,1650.)),4.)*3.;
  vec3 c=mix(hue(dot(h,g)*2.4+rad*1.6+grain*.06),vec3(1.),.38);
  float amt=uFoil*(.004+.24*mirror)*(.30+.70*rays)*(.25+.75*dust+.2*grain);
  vec3 col=c*amt;
  col+=vec3(1.,.95,.88)*pow(mirror,6.)*.035*uGlare;
  float sx=sweepX(vUv,V);
  col+=hue(sx*4.2+.1)*sweepBand(sx,.11)*uFoil*.20*(.35+.65*dust+.25*rays);
  col+=glitter(vUv*vec2(150.,225.),N,V,T,B,.30,420.)*2.2*uFoil;
  gl_FragColor=vec4(col*win*scanLit(vWPos)*.52,1.);
}`;

/** the card's face: gilt relief, paper and ink, under the studio */
export const FRAME_FRAG = /* glsl */ `
uniform sampler2D tFrame, tAux; varying vec2 vUv; varying vec3 vWPos;
void main(){
  vec4 fr=texture2D(tFrame,vUv);
  if(fr.a<.02) discard;
  vec4 ax=texture2D(tAux,vUv);
  vec2 nxy=ax.rg*2.-1.;
  vec3 nT=vec3(nxy,sqrt(max(1.-dot(nxy,nxy),0.)));
  vec3 T=axisT(),B=axisB(),Nf=axisN();
  vec3 N=normalize(T*nT.x+B*nT.y+Nf*nT.z);
  vec3 V=normalize(cameraPosition-vWPos);
  float gold=ax.b;
  vec3 alb=fr.rgb;
  float ndl=max(dot(N,uLightDir),0.);
  vec3 R=reflect(-V,N);
  float fres=pow(1.-max(dot(N,V),0.),5.);
  vec3 goldF0=min(clamp(alb*1.7,0.,1.)*vec3(1.,.80,.50),vec3(.85,.62,.34));
  vec3 col=alb*(.50+.40*ndl);
  col+=studio(R)*mix(vec3(.03),goldF0,gold)*(.55+.8*fres);
  vec3 H=normalize(uLightDir+V);
  float nh=max(dot(N,H),0.);
  col+=vec3(1.,.84,.56)*pow(nh,120.)*mix(.12,2.4,gold)*uGlare;
  col+=glitter(vUv*vec2(120.,180.),N,V,T,B,.40,300.)*gold*2.4;
  col+=holo(dot(V,T)*1.4+dot(V,B)*.9+vUv.y*1.6)*vec3(1.,.9,.7)*gold*pow(nh,14.)*.16*uFoil;
  float sx=sweepX(vUv,V);
  col+=mix(vec3(1.,.82,.52),hue(sx*4.2+.1),.55)*sweepBand(sx,.09)*gold*.55*uFoil;
  col+=vec3(1.,.36,.06)*ax.a*(.5+2.2*uFire);                               // the gems glow with the fire
  col=scanCard(col,vWPos,max(iso(gold,.5),iso(fr.a,.5)));                  // its wire: the gilding's outline
  gl_FragColor=vec4(col,smoothstep(.02,.55,fr.a));
}`;

/** the portrait cut-out: lit at its edge by the fire and by the softbox */
export const SUBJECT_FRAG = /* glsl */ `
uniform sampler2D tSubject; uniform vec2 uFireSub, uTexel, uAsp; uniform vec4 uRect;
varying vec2 vUv; varying vec3 vWPos;
void main(){
  vec4 s=texture2D(tSubject,vUv);
  if(s.a<.004) discard;
  vec3 col=s.rgb;
  vec3 T=axisT(),B=axisB();
  vec2 e=uTexel*3.;
  float aL=texture2D(tSubject,vUv-vec2(e.x,0.)).a, aR=texture2D(tSubject,vUv+vec2(e.x,0.)).a;
  float aU=texture2D(tSubject,vUv-vec2(0.,e.y)).a, aD=texture2D(tSubject,vUv+vec2(0.,e.y)).a;
  vec2 grad=vec2(aR-aL,aD-aU);
  float edge=clamp(length(grad)*1.4,0.,1.);
  vec2 n2=-grad/(length(grad)+1e-4);
  vec2 tf=(uFireSub-vUv)*uAsp; float fd=length(tf); tf/=fd+1e-4;
  vec3 fireCol=vec3(1.,.44,.13);
  col+=fireCol*max(dot(n2,tf),0.)*edge*uFire*1.9*exp(-fd*.9);
  col*=1.+fireCol*.24*uFire*exp(-fd*2.);
  vec2 l2=vec2(dot(uLightDir,T),dot(uLightDir,B));
  col+=vec3(.78,.84,1.)*max(dot(n2,normalize(l2+1e-4)),0.)*edge*.3*uGlare*min(length(l2)*1.6,1.);
  vec3 V=normalize(cameraPosition-vWPos);
  float sx=sweepX(uRect.xy+vUv*uRect.zw,V);
  col+=hue(sx*4.2+.1)*sweepBand(sx,.10)*.03*uFoil;
  col=scanCard(col,vWPos,iso(s.a,.5));                                     // its wire: the silhouette
  gl_FragColor=vec4(col,s.a);
}`;

export const GILT_VERT = /* glsl */ `
varying vec3 vWPos, vWN;
void main(){ vec4 w=modelMatrix*vec4(position,1.); vWPos=w.xyz; vWN=normalize(mat3(modelMatrix)*normal);
  gl_Position=projectionMatrix*viewMatrix*w; }`;

/** the card's gilt edge */
export const GILT_FRAG = /* glsl */ `
uniform float uDark; varying vec3 vWPos, vWN;
void main(){
  vec3 N=normalize(vWN), V=normalize(cameraPosition-vWPos);
  vec3 gold=vec3(1.,.74,.36)*mix(1.,.45,uDark);
  float fres=pow(1.-abs(dot(N,V)),4.);
  vec3 col=studio(reflect(-V,N))*gold*.9+gold*.025;
  col+=holo(dot(V,N)*3.+vWPos.y*.25)*vec3(1.,.85,.6)*(.04+.18*fres)*uFoil;
  gl_FragColor=vec4(scanCard(col,vWPos,iso(abs(dot(N,V)),.35)),1.);
}`;

/** the back: black lacquer, gold relief, a clear coat over all of it */
export const BACK_FRAG = /* glsl */ `
uniform sampler2D tBack, tBackAux; varying vec2 vUv; varying vec3 vWPos;
void main(){
  vec2 uv=vec2(1.-vUv.x,vUv.y);                  // seen from behind
  vec3 alb=texture2D(tBack,uv).rgb;
  vec4 ax=texture2D(tBackAux,uv);
  float gold=ax.b;
  vec3 V=normalize(cameraPosition-vWPos);
  vec2 nxy=ax.rg*2.-1.;
  vec3 T=-axisT(),B=axisB(),Nb=-axisN();
  vec3 N=normalize(T*nxy.x+B*nxy.y+Nb*sqrt(max(1.-dot(nxy,nxy),0.)));
  float ndl=max(dot(N,uLightDir),0.);
  vec3 H=normalize(uLightDir+V); float nh=max(dot(N,H),0.);
  vec3 goldF0=clamp(alb*1.8,0.,1.)*vec3(1.,.82,.54);
  vec3 col=alb*(.55+.45*ndl);
  col+=studio(reflect(-V,N))*mix(vec3(.03),goldF0,gold)*.9;
  col+=vec3(1.,.86,.6)*pow(nh,120.)*gold*2.4*uGlare;
  col+=holo(dot(V,T)*1.8+length(uv-.5)*3.)*vec3(1.,.86,.62)*gold*(.03+.22*pow(nh,8.))*uFoil;
  col+=glitter(uv*vec2(130.,195.),N,V,T,B,.35,300.)*gold*2.4;
  float sx=sweepX(uv,V);
  col+=mix(vec3(1.,.82,.52),hue(sx*4.2+.1),.5)*sweepBand(sx,.09)*gold*.6*uFoil;
  float fres=pow(1.-max(dot(Nb,V),0.),5.);
  col+=studio(reflect(-V,Nb))*(.025+.3*fres);    // lacquer clear coat
  gl_FragColor=vec4(scanCard(col,vWPos,iso(gold,.5)),1.);
}`;

/**
 * drifting cinders and ash in the room around the card: instanced quads, streaked along their motion,
 * and opened into soft bokeh discs the further they are from the focal plane.
 */
export const CINDER_VERT = /* glsl */ `
attribute vec4 aSeed, aSeed2;
uniform float uMode, uPx, uCamD, uLifeA, uLifeB, uSize, uStreak;
uniform vec2 uRes;
varying vec2 vC; varying float vFade, vHeat, vBokeh, vAsh;
vec3 roomPath(float tt,float period){
  float ph=fract(tt/period+aSeed2.w);
  float y=uMode>1.5 ? mix(11.,-11.,ph) : mix(-12.,12.,ph);   // ash settles, cinders rise
  vec3 p=vec3((aSeed.x-.5)*30.,y,(aSeed.z-.5)*20.-1.5);
  p.x+=sin(tt*.35+aSeed.y*30.)*.9+sin(ph*12.+aSeed.x*9.)*.35;
  p.z+=cos(tt*.28+aSeed.y*17.)*.6;
  return p;
}
void main(){
  vC=position.xy*2.;
  float period=mix(uLifeA,uLifeB,aSeed2.z);
  float phase=fract(uTime/period+aSeed2.w);
  vec3 p0=roomPath(uTime,period), p1=phase<.004 ? p0 : roomPath(uTime-.035,period);
  vec4 c0=projectionMatrix*modelViewMatrix*vec4(p0,1.);
  vec4 c1=projectionMatrix*modelViewMatrix*vec4(p1,1.);
  vec2 v=(c0.xy/c0.w-c1.xy/c1.w)*.5*uRes;          // screen velocity, px per 35 ms
  float dist=c0.w;
  float blur=clamp(abs(dist-uCamD)/9.,0.,1.6);
  vec2 tng=length(v)>.01 ? normalize(v) : vec2(0.,1.);
  bool ash=uMode>1.5;
  if(ash) tng=vec2(cos(aSeed.y*6.28+uTime*1.7),sin(aSeed.y*6.28+uTime*1.7));   // tumbling
  vec2 nrm=vec2(-tng.y,tng.x);
  float w=uSize*uPx*mix(.6,1.25,aSeed.w)*(uCamD/dist);
  w+=min(blur*blur,1.)*16.*uPx;
  float len=w+min(42.*uPx,length(v)*uStreak)*(1.-min(blur,1.));
  gl_Position=c0;
  gl_Position.xy+=(tng*position.x*len+nrm*position.y*w)/(.5*uRes)*c0.w;
  vBokeh=clamp(blur,0.,1.);
  vAsh=ash ? 1. : 0.;
  vHeat=mix(.30,.80,aSeed.y);
  float env=smoothstep(0.,.08,phase)*smoothstep(1.,.85,phase);
  vFade=env*(.45+.9*fract(aSeed.y*31.7))/(1.+blur*blur*7.);
  if(ash) vFade*=.25+.75*abs(sin(uTime*2.3+aSeed.x*20.));   // a turning flake catches the light
}`;

export const CINDER_FRAG = /* glsl */ `
uniform float uGain;
varying vec2 vC; varying float vFade, vHeat, vBokeh, vAsh;
void main(){
  float edge=1.-smoothstep(.16,1.,abs(vC.y));
  float tip=1.-smoothstep(.25,1.,abs(vC.x));
  float r=length(vC);
  float disc=smoothstep(1.,.80,r)*.55+smoothstep(1.,0.,r)*.35;
  float cov=mix(edge*edge*tip,disc,vBokeh);
  vec3 col=mix(vec3(.42,.036,.003),vec3(1.,.27,.025),smoothstep(0.,.75,vHeat));   // cools from yellow to dull red
  col=mix(col,vec3(1.,.84,.51),pow(vHeat,5.));
  col=mix(col,vec3(.34,.31,.28),vAsh);
  gl_FragColor=vec4(col*cov*vFade*uGain,1.);
}`;

/** sparks thrown off the card's surface as the burn passes */
export const SPARK_VERT = /* glsl */ `
attribute vec2 aSeed; uniform vec4 uScanC, uScanQ; uniform vec3 uCardO; uniform float uPx, uTime; uniform mat3 uRootRot;
varying float vAge, vA;
void main(){
  vec3 w=(modelMatrix*vec4(position,1.)).xyz;
  vec3 Nc=normalize(uRootRot*vec3(0.,0.,1.)), wf=w-Nc*dot(w-uCardO,Nc);
  float D=length(wf-uScanC.xyz), life=mix(.6,1.6,aSeed.x);
  float age=uScanQ.y-pow(D/uScanC.w,1./uScanQ.x)-aSeed.y*.2;
  vAge=age/life; vA=uScanQ.w*step(0.,age)*step(age,life)*step(.45,fract(aSeed.x*5.3+aSeed.y*2.1));
  vec3 p=w+Nc*(.05+.5*age*(.5+aSeed.y))+vec3(0.,1.2*age+.9*age*age,0.);
  p.x+=sin(age*5.+aSeed.x*40.)*.12*age;
  gl_Position=projectionMatrix*viewMatrix*vec4(p,1.);
  gl_PointSize=vA>0. ? uPx*mix(3.,1.4,vAge)*(.7+.6*aSeed.y) : 0.;
}`;
export const SPARK_FRAG = /* glsl */ `
varying float vAge, vA;
vec3 fire(float k){ return mix(mix(vec3(.3,.025,.004),vec3(1.,.3,.035),smoothstep(0.,.45,k)),vec3(1.,.86,.56),smoothstep(.55,1.,k)); }
void main(){
  if(vA<=0.) discard;
  vec2 d=gl_PointCoord-.5; float a=exp(-dot(d,d)*16.);
  gl_FragColor=vec4(fire(.78-.6*vAge)*a*(1.-vAge)*3.2,1.);
}`;

export const BACKDROP_VERT = /* glsl */ `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`;
/** the dark room: a warm glow under the card and around it, a slow smoke */
export const BACKDROP_FRAG = /* glsl */ `
uniform vec2 uRes, uCardPx; uniform float uCardH; varying vec2 vUv;
void main(){
  vec2 p=(vUv*uRes-uCardPx)/uCardH;
  float r=length(p*vec2(.85,1.));
  vec3 col=mix(vec3(.0070,.0051,.0040),vec3(.0010,.0009,.0009),smoothstep(.1,1.0,r));
  vec2 q=(p-vec2(0.,-.56))*vec2(1.5,5.);
  col+=vec3(.50,.15,.03)*exp(-dot(q,q)*1.1)*.05*uFire;
  vec2 bq=abs(p)-vec2(.31,.48); float bd=length(max(bq,0.))+min(max(bq.x,bq.y),0.);
  col+=vec3(.45,.20,.07)*exp(-max(bd,0.)*7.)*.030*(.8+.2*uFire);
  float sm=fbm(p*1.5+vec2(0.,-uTime*.03))*fbm(p*2.9-vec2(uTime*.02,0.));
  col+=vec3(.012,.010,.009)*sm*smoothstep(1.4,.2,r);
  gl_FragColor=vec4(col,1.);
}`;

/** the last pass: a breath of fringing, a neutral tone map, a vignette, film grain */
export const FINISH_FRAG = /* glsl */ `
uniform sampler2D tDiffuse; uniform float uTime, uExposure, uPR; varying vec2 vUv;
vec3 neutral(vec3 c){                         // Khronos PBR Neutral
  float x=min(c.r,min(c.g,c.b)); float off=x<.08?x-6.25*x*x:.04; c-=off;
  float peak=max(c.r,max(c.g,c.b)); const float sc=.76, dd=.24;
  if(peak<sc) return c;
  float np=1.-dd*dd/(peak+dd-sc); c*=np/peak;
  float g=1.-1./(.15*(peak-np)+1.); return mix(c,vec3(np),g);
}
vec3 srgb(vec3 c){ return mix(c*12.92,1.055*pow(c,vec3(1./2.4))-.055,step(.0031308,c)); }
float h(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
void main(){
  vec2 d=vUv-.5; float r=dot(d,d);
  vec2 ca=d*r*.0035/uPR;
  vec3 c=vec3(texture2D(tDiffuse,vUv-ca).r,texture2D(tDiffuse,vUv).g,texture2D(tDiffuse,vUv+ca).b);
  c=neutral(max(c*uExposure,0.));
  c*=1.-smoothstep(.14,.66,r)*.36;
  c=srgb(clamp(c,0.,1.));
  vec2 gp=floor(gl_FragCoord.xy/1.5)+floor(uTime*24.)*vec2(17.,31.);
  float grain=h(gp)+h(gp+vec2(3.1,7.7))-1.;
  float lum=dot(c,vec3(.2126,.7152,.0722));
  c+=grain*.034*(.30+.70*smoothstep(0.,.30,lum)*(1.-smoothstep(.65,1.,lum)));
  gl_FragColor=vec4(c,1.);
}`;
