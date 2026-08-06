#!/usr/bin/env python3
"""Compose chroma-key decorative sources into runtime-ready RGBA atlases."""
from pathlib import Path
import struct, zlib

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "source"
PUBLIC = ROOT.parent.parent / "public/assets/generated"
PUBLIC.mkdir(parents=True, exist_ok=True)
SIG = b"\x89PNG\r\n\x1a\n"

def read_png(path):
    raw = path.read_bytes(); assert raw.startswith(SIG)
    pos = 8; ids = bytearray(); width = height = ct = depth = interlace = None
    while pos < len(raw):
        n = struct.unpack(">I", raw[pos:pos+4])[0]; typ = raw[pos+4:pos+8]; chunk = raw[pos+8:pos+8+n]; pos += n + 12
        if typ == b"IHDR": width, height, depth, ct, _, _, interlace = struct.unpack(">IIBBBBB", chunk)
        elif typ == b"IDAT": ids.extend(chunk)
        elif typ == b"IEND": break
    if depth != 8 or interlace != 0 or ct not in (2, 6): raise ValueError(f"Unsupported PNG {path}")
    channels = 4 if ct == 6 else 3; stride = width * channels
    decoded = zlib.decompress(ids); pixels = bytearray(height * stride); prev = bytearray(stride); off = 0
    for y in range(height):
        ft = decoded[off]; enc = decoded[off+1:off+1+stride]; off += stride + 1; row = bytearray(stride)
        for i, val in enumerate(enc):
            left = row[i-channels] if i >= channels else 0; up = prev[i]; ul = prev[i-channels] if i >= channels else 0
            if ft == 0: pred = 0
            elif ft == 1: pred = left
            elif ft == 2: pred = up
            elif ft == 3: pred = (left + up)//2
            elif ft == 4:
                p = left + up - ul; ds = (abs(p-left), abs(p-up), abs(p-ul)); pred = (left, up, ul)[ds.index(min(ds))]
            else: raise ValueError(f"Unsupported PNG filter {ft}")
            row[i] = (val + pred) & 255
        pixels[y*stride:(y+1)*stride] = row; prev = row
    rgba = bytearray(width*height*4)
    for y in range(height):
        for x in range(width):
            s=(y*width+x)*channels; d=(y*width+x)*4; rgba[d:d+3]=pixels[s:s+3]; rgba[d+3]=pixels[s+3] if channels==4 else 255
            r,g,b=rgba[d:d+3]
            if g > 210 and r < 80 and b < 100: rgba[d+3]=0
    return width,height,rgba

def write_png(path, width, height, pixels):
    def chunk(t, payload): return struct.pack(">I",len(payload))+t+payload+struct.pack(">I",zlib.crc32(t+payload)&0xffffffff)
    stride=width*4; scan=b"".join(b"\0"+pixels[y*stride:(y+1)*stride] for y in range(height)
    )
    hdr=struct.pack(">IIBBBBB",width,height,8,6,0,0,0)
    path.write_bytes(SIG+chunk(b"IHDR",hdr)+chunk(b"IDAT",zlib.compress(scan,9))+chunk(b"IEND",b""))

def crop_bounds(w,h,pix):
    xs=[]; ys=[]
    for y in range(h):
        for x in range(w):
            if pix[(y*w+x)*4+3]: xs.append(x); ys.append(y)
    return (min(xs),min(ys),max(xs)+1,max(ys)+1) if xs else (0,0,w,h)

def resize_nearest(src, sw, sh, dw, dh):
    out=bytearray(dw*dh*4)
    for y in range(dh):
        sy=min(sh-1, y*sh//dh)
        for x in range(dw):
            sx=min(sw-1, x*sw//dw); out[(y*dw+x)*4:(y*dw+x+1)*4]=src[(sy*sw+sx)*4:(sy*sw+sx+1)*4]
    return out

def compose_props():
    w,h,pix=read_png(SOURCE/"decorative-props-key.png"); assert (w,h)==(1536,1024)
    out=bytearray(768*512*4)
    for i in range(6):
        col=i%3; row=i//3; sx=col*512; sy=row*512; cell=bytearray()
        for y in range(512): cell.extend(pix[((sy+y)*w+sx)*4:((sy+y)*w+sx+512)*4])
        x0,y0,x1,y1=crop_bounds(512,512,cell); cw,ch=x1-x0,y1-y0; scale=min(224/cw,224/ch,1.0); dw=max(1,round(cw*scale)); dh=max(1,round(ch*scale))
        crop=bytearray();
        for y in range(y0,y1): crop.extend(cell[(y*512+x0)*4:(y*512+x1)*4])
        scaled=resize_nearest(crop,cw,ch,dw,dh); dx=col*256+(256-dw)//2; dy=row*256+232-dh
        for y in range(dh): out[((dy+y)*768+dx)*4:((dy+y)*768+dx+dw)*4]=scaled[y*dw*4:(y+1)*dw*4]
    write_png(ROOT/"decorative-atlas.png",768,512,out); write_png(PUBLIC/"decorative-atlas.png",768,512,out)

def compose_platform(name):
    w,h,pix=read_png(SOURCE/f"{name}-platform-key.png"); out=bytearray(384*128*4); third=w//3
    for i in range(3):
        x0=i*third; x1=(i+1)*third if i<2 else w; crop=bytearray()
        for y in range(h): crop.extend(pix[(y*w+x0)*4:(y*w+x1)*4])
        scaled=resize_nearest(crop,x1-x0,h,128,112)
        for y in range(112):
            start = ((y + 8) * 384 + i * 128) * 4
            out[start:start + 128 * 4] = scaled[y * 128 * 4:(y + 1) * 128 * 4]
    write_png(PUBLIC/f"{name}-platform-strip.png",384,128,out)

if __name__ == "__main__":
    compose_props(); compose_platform("branch"); compose_platform("metal"); print("Wrote decorative atlas and platform strips")
