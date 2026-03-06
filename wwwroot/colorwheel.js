window.chromaMix = (() => {
    const wheels = {};
    const isMobile = () => window.innerWidth <= 900;

    function drawWheel(canvasId, saturation, lightness) {
        saturation = saturation || 100; lightness = lightness || 50;
        const canvas = document.getElementById(canvasId);
        if (!canvas) { setTimeout(() => drawWheel(canvasId, saturation, lightness), 100); return; }
        const ctx = canvas.getContext('2d');
        const W = canvas.width, H = canvas.height, cx = W/2, cy = H/2, outerR = cx-4;
        const sat = saturation/100, imgData = ctx.createImageData(W,H), data = imgData.data;
        for (let y=0;y<H;y++) for (let x=0;x<W;x++) {
            const dx=x-cx,dy=y-cy,dist=Math.sqrt(dx*dx+dy*dy);
            if (dist>outerR) continue;
            let hue=Math.atan2(dy,dx)*180/Math.PI+90; if(hue<0) hue+=360;
            const t=dist/outerR;
            const lum=t<0.35 ? 95-(95-lightness)*(t/0.35) : lightness-(lightness-Math.max(5,lightness-28))*((t-0.35)/0.65);
            const [r,g,b]=hslToRgb(hue/360,sat,lum/100);
            const idx=(y*W+x)*4; data[idx]=r;data[idx+1]=g;data[idx+2]=b;data[idx+3]=255;
        }
        ctx.putImageData(imgData,0,0);
        ctx.beginPath();ctx.arc(cx,cy,3,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,0.6)';ctx.fill();
        wheels[canvasId]={canvas,saturation,lightness};
    }

    function hslToRgb(h,s,l){
        if(s===0){const v=Math.round(l*255);return[v,v,v];}
        const q=l<0.5?l*(1+s):l+s-l*s,p=2*l-q;
        return[hueC(p,q,h+1/3),hueC(p,q,h),hueC(p,q,h-1/3)];
    }
    function hueC(p,q,t){
        if(t<0)t+=1;if(t>1)t-=1;
        if(t<1/6)return Math.round((p+(q-p)*6*t)*255);
        if(t<1/2)return Math.round(q*255);
        if(t<2/3)return Math.round((p+(q-p)*(2/3-t)*6)*255);
        return Math.round(p*255);
    }

    function pickPixel(id,x,y){const c=(wheels[id]||{}).canvas||document.getElementById(id);if(!c)return null;const d=c.getContext('2d').getImageData(Math.round(x),Math.round(y),1,1).data;return[d[0],d[1],d[2],d[3]];}

    function getHueAt(id,x,y){const c=(wheels[id]||{}).canvas||document.getElementById(id);if(!c)return -1;const cx=c.width/2,cy=c.height/2,dx=x-cx,dy=y-cy,dist=Math.sqrt(dx*dx+dy*dy);if(dist>cx-4)return -1;let a=Math.atan2(dy,dx)*180/Math.PI+90;if(a<0)a+=360;return a;}

    function getColorAt(id,x,y){
        const c=(wheels[id]||{}).canvas||document.getElementById(id);if(!c)return null;
        const e=wheels[id],lt=e?e.lightness:50;
        const cx=c.width/2,cy=c.height/2,dx=x-cx,dy=y-cy,dist=Math.sqrt(dx*dx+dy*dy),outerR=cx-4;
        if(dist>outerR)return null;
        let hue=Math.atan2(dy,dx)*180/Math.PI+90;if(hue<0)hue+=360;
        const t=dist/outerR;
        const lum=t<0.35?95-(95-lt)*(t/0.35):lt-(lt-Math.max(5,lt-28))*((t-0.35)/0.65);
        return{hue:hue,lum:Math.round(lum)};
    }

    // ══ LOUPE ROUE (desktop 130px×6 / mobile 44px×4) ═════════════════════════
    function drawWheelZoom(srcId,zoomId,cx_c,cy_c){
        const src=document.getElementById(srcId),zoom=document.getElementById(zoomId);
        if(!src||!zoom)return;
        const e=wheels[srcId];if(!e)return;
        const {saturation,lightness}=e;
        const size=isMobile()?44:130, factor=isMobile()?4:6, half=size/2, srcPx=size/factor;
        zoom.width=size;zoom.height=size;
        zoom.style.display='block';zoom.style.width=size+'px';zoom.style.height=size+'px';
        // Desktop : centré sur le curseur / Mobile : au-dessus du doigt
        zoom.style.left=(cx_c-half)+'px';
        zoom.style.top=(isMobile()?(cy_c-size-8):(cy_c-half))+'px';
        const zc=zoom.getContext('2d');
        const img=zc.createImageData(size,size),data=img.data;
        const W=src.width,wcx=W/2,wcy=src.height/2,outerR=wcx-4;
        for(let py=0;py<size;py++) for(let px=0;px<size;px++){
            const ldx=px-half,ldy=py-half;
            if(Math.sqrt(ldx*ldx+ldy*ldy)>half)continue;
            const wx=cx_c+ldx*(srcPx/size),wy=cy_c+ldy*(srcPx/size);
            const dx=wx-wcx,dy=wy-wcy,dist=Math.sqrt(dx*dx+dy*dy);
            let r,g,b;
            if(dist>outerR){r=g=b=17;}
            else{
                let hue=Math.atan2(dy,dx)*180/Math.PI+90;if(hue<0)hue+=360;
                const t=dist/outerR;
                const lum=t<0.35?95-(95-lightness)*(t/0.35):lightness-(lightness-Math.max(5,lightness-28))*((t-0.35)/0.65);
                [r,g,b]=hslToRgb(hue/360,saturation/100,lum/100);
            }
            const idx=(py*size+px)*4;data[idx]=r;data[idx+1]=g;data[idx+2]=b;data[idx+3]=255;
        }
        zc.putImageData(img,0,0);
        zc.beginPath();zc.arc(half,half,half-1,0,Math.PI*2);
        zc.strokeStyle='rgba(255,255,255,0.95)';zc.lineWidth=isMobile()?1.5:3;zc.stroke();
        zc.strokeStyle='rgba(0,0,0,0.25)';zc.lineWidth=1;zc.stroke();
        const arm=Math.max(4,Math.round(size*0.11));
        zc.strokeStyle='rgba(255,255,255,0.9)';zc.lineWidth=isMobile()?1:1.5;
        zc.shadowColor='rgba(0,0,0,0.9)';zc.shadowBlur=3;
        zc.beginPath();zc.moveTo(half-arm,half);zc.lineTo(half+arm,half);zc.moveTo(half,half-arm);zc.lineTo(half,half+arm);
        zc.stroke();zc.shadowBlur=0;
    }

    function hideWheelZoom(id){const z=document.getElementById(id);if(z)z.style.display='none';}

    // ══ PIPETTE ═══════════════════════════════════════════════════════════════
    let _pCtx=null,_pCanvas=null,_zCanvas=null;

    function loadPipetteFromDataUrl(dataUrl,dotNetRef){
        const img=new Image();
        img.onload=()=>tryDraw(img,dataUrl,dotNetRef,15);
        img.onerror=()=>console.error('ChromaMix: image pipette invalide');
        img.src=dataUrl;
    }

    function tryDraw(img,dataUrl,dotNetRef,n){
        _pCanvas=document.getElementById('pipetteCanvas');
        _zCanvas=document.getElementById('zoomCanvas');
        if(!_pCanvas&&n>0){setTimeout(()=>tryDraw(img,dataUrl,dotNetRef,n-1),150);return;}
        if(!_pCanvas){console.warn('pipetteCanvas introuvable');return;}
        const wrap=_pCanvas.parentElement,maxW=wrap?(wrap.offsetWidth||340):340;
        const scale=Math.min(1,maxW/img.naturalWidth);
        _pCanvas.width=Math.round(img.naturalWidth*scale);
        _pCanvas.height=Math.round(img.naturalHeight*scale);
        _pCtx=_pCanvas.getContext('2d');
        _pCtx.drawImage(img,0,0,_pCanvas.width,_pCanvas.height);
        dotNetRef.invokeMethodAsync('OnPipetteImageReady',dataUrl);
    }

    // Desktop : loupe suit la souris (sans retourner la couleur)
    function pipettePreview(cssX,cssY){
        if(!_pCtx||!_pCanvas)return;
        _zCanvas=_zCanvas||document.getElementById('zoomCanvas');
        if(!_zCanvas)return;
        // Ratio CSS → canvas (car le canvas est affiché en width:100%)
        const rect=_pCanvas.getBoundingClientRect();
        const scaleX=_pCanvas.width/rect.width;
        const scaleY=_pCanvas.height/rect.height;
        const cx=cssX*scaleX, cy=cssY*scaleY; // coords canvas réelles
        const size=130,half=size/2;
        // Positionner en coordonnées CSS (affichage)
        _zCanvas.style.left=(cssX-half)+'px';
        _zCanvas.style.top=(cssY-half)+'px';
        _drawPipetteZoom(_zCanvas,cx,cy,size,6);
    }

    // Mobile : loupe au-dessus du doigt + retourne la couleur
    function pipetteTouchPreview(cx,cy,clientX,clientY){
        if(!_pCtx)return null;
        _zCanvas=_zCanvas||document.getElementById('zoomCanvas');
        if(_zCanvas&&_pCanvas){
            const wr=_pCanvas.parentElement;
            if(wr){
                const r=wr.getBoundingClientRect(),pz=44;
                _zCanvas.style.left=(clientX-r.left-pz/2)+'px';
                _zCanvas.style.top=(clientY-r.top-pz-8)+'px';
                _drawPipetteZoom(_zCanvas,cx,cy,pz,4);
            }
        }
        const px=_pCtx.getImageData(Math.round(cx),Math.round(cy),1,1).data;
        return[px[0],px[1],px[2]];
    }

    // Retourne [R,G,B] du pixel — utilisé par le clic desktop (cssX/Y → canvas)
    function pipettePickColor(cssX,cssY){
        if(!_pCtx||!_pCanvas)return null;
        const rect=_pCanvas.getBoundingClientRect();
        const cx=cssX*(_pCanvas.width/rect.width);
        const cy=cssY*(_pCanvas.height/rect.height);
        const px=_pCtx.getImageData(Math.round(cx),Math.round(cy),1,1).data;
        return[px[0],px[1],px[2]];
    }

    function _drawPipetteZoom(zc,x,y,size,factor){
        const half=size/2,src=size/factor;
        zc.width=size;zc.height=size;
        zc.style.display='block';zc.style.width=size+'px';zc.style.height=size+'px';
        const ctx=zc.getContext('2d');
        ctx.clearRect(0,0,size,size);
        ctx.save();ctx.beginPath();ctx.arc(half,half,half-2,0,Math.PI*2);ctx.clip();
        ctx.imageSmoothingEnabled=false;
        ctx.drawImage(_pCanvas,x-src/2,y-src/2,src,src,0,0,size,size);
        ctx.restore();
        ctx.beginPath();ctx.arc(half,half,half-2,0,Math.PI*2);
        ctx.strokeStyle='rgba(255,255,255,0.9)';ctx.lineWidth=size<60?1.5:2.5;ctx.stroke();
        const arm=Math.max(4,Math.round(size*0.08));
        ctx.strokeStyle='rgba(255,255,255,0.9)';ctx.lineWidth=size<60?1:1.5;
        ctx.shadowColor='rgba(0,0,0,0.8)';ctx.shadowBlur=2;
        ctx.beginPath();ctx.moveTo(half-arm,half);ctx.lineTo(half+arm,half);ctx.moveTo(half,half-arm);ctx.lineTo(half,half+arm);
        ctx.stroke();ctx.shadowBlur=0;
    }

    function hidePipetteZoom(){
        _zCanvas=_zCanvas||document.getElementById('zoomCanvas');
        if(_zCanvas)_zCanvas.style.display='none';
    }

    function getCanvasOffset(id,clientX,clientY){
        const c=document.getElementById(id);if(!c)return null;
        const r=c.getBoundingClientRect();
        return[(clientX-r.left)*(c.width/r.width),(clientY-r.top)*(c.height/r.height)];
    }

    function scrollToResults(){
        if(window.innerWidth>900)return;
        const p=document.getElementById('results-panel');
        if(p)p.scrollIntoView({behavior:'smooth',block:'start'});
    }

    function updateHslThumbs(){
        document.querySelectorAll('.hsl-track').forEach(t=>{
            const i=t.querySelector('input[type=range]');if(!i)return;
            t.style.setProperty('--thumb-pct',((+i.value-+i.min)/(+i.max-+i.min))*100+'%');
        });
    }
    document.addEventListener('input',e=>{if(e.target&&e.target.classList.contains('hsl-input'))updateHslThumbs();});

    return{
        drawWheel,pickPixel,getHueAt,getColorAt,
        drawWheelZoom,hideWheelZoom,
        loadPipetteFromDataUrl,pipettePreview,pipettePickColor,pipetteTouchPreview,hidePipetteZoom,
        getCanvasOffset,scrollToResults,updateHslThumbs
    };
})();
