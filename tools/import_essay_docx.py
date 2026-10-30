#!/usr/bin/env python3
"""Import the approved Word essay, retaining the site's interactive charts.

Usage: python tools/import_essay_docx.py final-essay.docx [site-directory]
Requires lxml. The Word file is read only; comments and cover/contents are omitted.
Run generate_essay_pdf.py afterwards to update the offline edition.
"""
from pathlib import Path
from zipfile import ZipFile
from copy import deepcopy
from collections import Counter
from html import escape
import sys, re, hashlib, json
from lxml import etree as E, html

ROOT = Path(__file__).resolve().parents[1]
DIST = Path(sys.argv[2]) if len(sys.argv)>2 else ROOT/('dist' if (ROOT/'dist').exists() else 'docs')
SOURCE = Path(sys.argv[1])
W='http://schemas.openxmlformats.org/wordprocessingml/2006/main'
R='http://schemas.openxmlformats.org/officeDocument/2006/relationships'
NS={'w':W,'r':R}
def text(p): return ''.join(p.xpath('.//w:t/text()',namespaces=NS))
def norm(s): return re.sub(r'\s+',' ',s).strip()
with ZipFile(SOURCE) as z:
    body=E.fromstring(z.read('word/document.xml')).find('w:body',NS)
    rels={r.get('Id'):r.get('Target') for r in E.fromstring(z.read('word/_rels/document.xml.rels'))}
    assert not body.findall('.//w:ins',NS) and not body.findall('.//w:del',NS), 'Resolve tracked changes before importing the final essay.'

def style(p):
    s=p.find('w:pPr/w:pStyle',NS)
    return s.get('{'+W+'}val','') if s is not None else ''
def inline(node):
    tag=E.QName(node).localname
    if tag=='t': return escape(node.text or '')
    if tag=='tab': return ' '
    if tag=='br': return '<br>' if node.get('{'+W+'}type') not in ['page','column'] else ''
    if tag in ['pPr','rPr','drawing','pict','commentReference','lastRenderedPageBreak','del']:return ''
    s=''.join(inline(c) for c in node)
    if tag=='r':
        pr=node.find('w:rPr',NS)
        if pr is not None:
            for prop,wrap in [('b','strong'),('i','em')]:
                el=pr.find('w:'+prop,NS)
                if el is not None and el.get('{'+W+'}val','1') not in ['0','false','off'] and s:s=f'<{wrap}>{s}</{wrap}>'
    if tag=='hyperlink':
        anchor=node.get('{'+W+'}anchor')
        url=('#'+anchor) if anchor else rels.get(node.get('{'+R+'}id'),'')
        if url.startswith('https://geldgedrag.be/'):url=url.removeprefix('https://geldgedrag.be/')
        if url:
            extra=' target="_blank" rel="noopener noreferrer"' if url.startswith(('https://','http://')) else ''
            label=' aria-label="Bron '+anchor[5:]+'"' if anchor and anchor.startswith('bron-') else ''
            return '<a href="'+escape(url,quote=True)+'"'+extra+label+'>'+s+'</a>'
    return s
def paragraph(p,cls=None):
    el=html.fragment_fromstring('<p>'+inline(p)+'</p>')
    if cls:el.set('class',cls)
    return el

page=DIST/'essay.html'
root=html.fromstring(page.read_text())
article=root.xpath('//article')[0]
intro=deepcopy(article.xpath('./section[contains(@class,"essay-introduction")]')[0])
download=deepcopy(article.xpath('./aside[contains(@class,"essay-download")]')[0])
offline=deepcopy(article.xpath('./section[contains(@class,"essay-offline")]')[0])
figures=[deepcopy(f) for f in article.xpath('./figure')]
assert len(figures)==6, 'Expected the six existing interactive charts.'
ps=list(body)
first=next(i for i,p in enumerate(ps) if style(p)=='Heading1' and text(p)=='Inleiding')
lead=[p for p in ps[:first] if style(p)=='Quote'][-1]
description=next(p for p in reversed(ps[:first]) if norm(text(p)) and style(p) not in ['Quote','Contents1','Contents2'])
intro_quote=intro.xpath('.//blockquote/p')[0]
intro_quote.getparent().replace(intro_quote,paragraph(lead))
intro_ps=intro.xpath('./p')
assert len(intro_ps)==1
intro.replace(intro_ps[0],paragraph(description))
for c in list(article):article.remove(c)
article.append(intro);article.append(download)
expected=[norm(text(lead)),norm(text(description))]
part=0;chapters=0;figidx=0;in_sources=False;source_count=0
i=first
while i<len(ps):
    p=ps[i];s=text(p);sty=style(p);tag=E.QName(p).localname
    if sty=='Caption':
        fig=figures[figidx];figidx+=1
        title=fig.xpath('.//figcaption//strong')[0];title.text=s
        for c in list(title):title.remove(c)
        end=i+1
        while end<len(ps) and (style(ps[end])=='Small' or E.QName(ps[end]).localname=='tbl' or not norm(text(ps[end]))):end+=1
        notes=[q for q in ps[i+1:end] if style(q)=='Small'][1:]
        oldnotes=[q for q in fig.xpath('./p') if 'essay-chart-note' in q.get('class','') and q.get('data-area-note') is None]
        for q in oldnotes:fig.remove(q)
        # Keep historical UI source definitions, controls, IDs and yearly-value tables.
        insertion=next((fig.index(q) for q in fig if q.tag=='details'),len(fig))
        for q in notes:
            cls='essay-chart-note'+(' essay-source-line' if text(q).startswith('Bronlinks:') else '')
            fig.insert(insertion,paragraph(q,cls));insertion+=1
            expected.append(norm(text(q)))
        article.append(fig);expected.append(norm(s));i=end;continue
    if tag=='p' and norm(s):
        if sty=='Heading1':
            if s.startswith('Deel '):
                part+=1;m=re.fullmatch(r'(Deel [IVX]+)\s+(.*)',s);assert m
                el=html.fragment_fromstring('<h2 class="essay-part-title" id="deel-'+str(part)+'"><span class="essay-part-number">'+escape(m[1])+'</span> <span class="essay-heading-text">'+escape(m[2])+'</span></h2>')
            else:
                in_sources=s=='Bronnen en verantwoording'
                el=E.Element('h2',{'class':'essay-part-title'+(' essay-intro-title' if s=='Inleiding' else ''),'id':'bronnen' if in_sources else 'inleiding'});el.text=s
        elif sty=='Heading2':
            m=re.fullmatch(r'(\d+)\s+(.*)',s);assert m;chapters+=1
            el=html.fragment_fromstring('<h3 class="essay-chapter-title" id="hoofdstuk-'+m[1]+'"><span class="essay-chapter-number">'+m[1]+'</span> <span class="essay-heading-text">'+escape(m[2])+'</span></h3>')
        else:
            el=paragraph(p)
            if in_sources:
                m=re.match(r'(\d+)\s*·',s)
                if m:el.set('id','bron-'+m[1]);source_count+=1
        article.append(el);expected.append(norm(s))
    i+=1
article.append(offline)
assert (part,chapters,figidx,source_count)==(5,26,6,45),(part,chapters,figidx,source_count)
actual=norm(''.join(article.itertext()))
missing=[s for s in expected if s not in actual]
assert not missing, ('Word text missing after conversion',missing)
ids=root.xpath('//@id');assert len(ids)==len(set(ids)), 'Duplicate HTML IDs'
for a in article.xpath('.//a[starts-with(@href,"#")]'):
    assert a.get('href')[1:] in ids, a.get('href')
page.write_text('<!DOCTYPE html>\n'+html.tostring(root,encoding='unicode',method='html')+'\n')
print(json.dumps({'word_sha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'verified_text_blocks':len(expected),'parts':part,'chapters':chapters,'charts':figidx,'sources':source_count,'output':str(page)},ensure_ascii=False))
