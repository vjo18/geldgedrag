#!/usr/bin/env python3
"""Generate the downloadable offline edition directly from essay.html and its CSVs.
Run: python scripts/generate_essay_pdf.py [output.pdf]
Requires reportlab, matplotlib and numpy. No network or browser required.
"""
from pathlib import Path
from html.parser import HTMLParser
from html import escape
import csv, io, re, sys
from datetime import datetime
from zoneinfo import ZoneInfo
NOW=datetime.now(ZoneInfo("Europe/Brussels"))
MONTHS=["januari","februari","maart","april","mei","juni","juli","augustus","september","oktober","november","december"]
EDITION=f"{NOW.day} {MONTHS[NOW.month-1]} {NOW.year}"
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.ticker import FuncFormatter
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.platypus import BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, PageBreak, KeepTogether, Image, Table, TableStyle
from reportlab.platypus.tableofcontents import TableOfContents
ROOT=Path(__file__).resolve().parents[1]; DIST=ROOT/'docs'
OUT=Path(sys.argv[1]) if len(sys.argv)>1 else DIST/'essay-geldgedrag.pdf'
OUT.parent.mkdir(parents=True,exist_ok=True)
INK='#233e33'; MUTED='#667368'; ACCENT='#976342'; PAPER='#f8f6f0'; LINE='#d9ddd0'
FONT=Path('/usr/share/fonts/truetype/dejavu')
for name,file in [('Serif','DejaVuSerif.ttf'),('SerifBold','DejaVuSerif-Bold.ttf'),('Sans','DejaVuSans.ttf'),('SansBold','DejaVuSans-Bold.ttf')]:pdfmetrics.registerFont(TTFont(name,str(FONT/file)))
pdfmetrics.registerFontFamily('Serif',normal='Serif',bold='SerifBold',italic='Serif',boldItalic='SerifBold')
pdfmetrics.registerFontFamily('Sans',normal='Sans',bold='SansBold',italic='Sans',boldItalic='SansBold')
class Node:
 def __init__(self,tag='',attrs=()):self.tag=tag;self.attrs=dict(attrs);self.children=[]
 def text(self):return ''.join(c.text() if isinstance(c,Node) else c for c in self.children)
 def all(self,tag):
  result=[]
  for c in self.children:
   if isinstance(c,Node):
    if c.tag==tag:result.append(c)
    result.extend(c.all(tag))
  return result
class DOM(HTMLParser):
 def __init__(self,s):super().__init__();self.root=Node();self.stack=[self.root];self.feed(s)
 def handle_starttag(self,t,a):
  n=Node(t,a);self.stack[-1].children.append(n)
  if t not in ['br','img','meta','link','hr','input','source','wbr']:self.stack.append(n)
 def handle_endtag(self,t):
  for i in range(len(self.stack)-1,0,-1):
   if self.stack[i].tag==t:self.stack=self.stack[:i];break
 def handle_data(self,s):self.stack[-1].children.append(s)
def clean(s):return re.sub(r'\s+',' ',s).strip().replace('\u2011','-').replace('\u2013','-').replace('\u2014','-')
def txt(n):return clean(n.text())
def esc(s):return escape(clean(s))
def inline(n):
 """Preserve source links and emphasis in the offline reading edition."""
 if isinstance(n,str):return escape(re.sub(r'\s+',' ',n).replace('\u2011','-').replace('\u2013','-').replace('\u2014','-'))
 content=''.join(inline(c) for c in n.children)
 if n.tag=='a' and n.attrs.get('href','').startswith('https://'):
  return '<link href="'+escape(n.attrs['href'],quote=True)+'" color="#976342">'+content+'</link>'
 if n.tag in ('strong','b'):return '<b>'+content+'</b>'
 if n.tag in ('em','i'):return '<i>'+content+'</i>'
 return content
dom=DOM((DIST/'essay.html').read_text());article=dom.root.all('article')[0]
rows=list(csv.DictReader((DIST/'jaarreeksen.csv').open(),delimiter=';'))
for r in rows:
 for k,v in r.items():r[k]=int(v) if k=='year' else float(v.replace(',','.')) if v else None
long=list(csv.DictReader((DIST/'langetermijn.csv').open(),delimiter=';'))
for r in long:
 for k,v in r.items():r[k]=int(v) if k=='year' else float(v)
S={}
def style(name,**kw):
 defaults=dict(fontName='Serif',fontSize=10.2,leading=15.6,textColor=colors.HexColor(INK),spaceAfter=10,allowWidows=0,allowOrphans=0);defaults.update(kw);S[name]=ParagraphStyle(name,**defaults);return S[name]
style('Body');style('Small',fontSize=8,leading=12,textColor=colors.HexColor(MUTED));style('Reference',fontSize=8.5,leading=12,spaceAfter=8)
style('Part',fontSize=25,leading=31,spaceAfter=25,keepWithNext=True)
style('Chapter',fontSize=15,leading=20,spaceBefore=20,spaceAfter=12,keepWithNext=True)
style('Eyebrow',fontName='SansBold',fontSize=8,leading=12,textColor=colors.HexColor(ACCENT),spaceAfter=12)
style('Quote',fontSize=17,leading=25,spaceBefore=16,spaceAfter=22)
style('FigureTitle',fontSize=13,leading=18,spaceBefore=10,spaceAfter=9,keepWithNext=True)
style('Cell',fontName='Sans',fontSize=7.5,leading=11,spaceAfter=0)
style('Cover',fontSize=40,leading=47,spaceAfter=30)
style('TOC0',fontName='Serif',fontSize=11.5,leading=16,spaceBefore=10,spaceAfter=3)
style('TOC1',fontName='Sans',fontSize=8,leading=11.5,leftIndent=14,spaceAfter=2)
def P(text,sty='Body'):return Paragraph(text,S[sty])
W,H=A4;M=62;CW=W-2*M
class EssayDoc(BaseDocTemplate):
 def afterFlowable(self,f):
  if getattr(f,'tocText',None):
   self.canv.bookmarkPage(f.bookmark)
   self.canv.addOutlineEntry(f.tocText,f.bookmark,level=f.tocLevel,closed=False)
   self.notify('TOCEntry',(f.tocLevel,f.tocText,self.page,f.bookmark))
def decorate(c,doc):
 c.saveState()
 if doc.page==1:
  c.setFillColor(colors.HexColor(PAPER));c.rect(0,0,W,H,fill=1,stroke=0)
  c.setFillColor(colors.HexColor(INK));c.rect(0,0,17,H,fill=1,stroke=0)
  c.setFillColor(colors.HexColor(ACCENT));c.circle(W-83,H-82,12,fill=1,stroke=0)
 else:
  c.setFont('Sans',7.5);c.setFillColor(colors.HexColor(MUTED));c.drawString(M,H-35,'GELDGEDRAG');c.drawRightString(W-M,H-35,'Waarom vermogen opbouwen?')
  c.setStrokeColor(colors.HexColor(LINE));c.line(M,44,W-M,44);c.setFont('Sans',7);c.drawString(M,29,'geldgedrag.be  ·  Leeseditie');c.drawRightString(W-M,29,str(doc.page))
 c.restoreState()
doc=EssayDoc(str(OUT),pagesize=A4,leftMargin=M,rightMargin=M,topMargin=61,bottomMargin=61,title='Waarom vermogen opbouwen? - Geldgedrag',author='Geldgedrag',subject='Het volledige essay met grafieken en bronnen, voor offline lezen.')
doc.addPageTemplates(PageTemplate(id='essay',frames=Frame(M,61,CW,H-122,id='body',leftPadding=0,rightPadding=0,topPadding=0,bottomPadding=0),onPage=decorate))
story=[Spacer(1,58),P('GELDGEDRAG · HET ESSAY','Eyebrow'),Spacer(1,23),P('Waarom vermogen<br/>opbouwen?','Cover'),P('Begrijp geld.<br/>Bepaal genoeg.<br/>Bouw vermogen op.','Quote'),Spacer(1,55),P('Een leesversie voor onderweg, op papier<br/>of voor een rustig moment zonder scherm.','Body'),Spacer(1,35),P(EDITION+' · Met grafieken en bronverantwoording','Small'),P('<link href="https://geldgedrag.be/essay.html" color="#976342">De webeditie en interactieve grafieken bekijken</link>','Small'),PageBreak(),P('Inhoud','Part')]
toc=TableOfContents(tableStyle=TableStyle([('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0),('TOPPADDING',(0,0),(-1,-1),0),('BOTTOMPADDING',(0,0),(-1,-1),0)]));toc.levelStyles=[S['TOC0'],S['TOC1']];story.extend([toc,PageBreak()])
labels={'m3_ea_bn':'M3 · eurozone','debt_be_bn':'Overheidsschuld · België','household_debt_be_bn':'Schuld huishoudens · België','company_debt_be_bn':'Schuld ondernemingen · België','cpi_be':'CPI · België','gdp_be_bn':'Nominaal bbp · België','wage_be_eur':'Bruto jaarloon · België','house_index_be':'Woningprijsindex · België','msci_eur':'Wereldaandelen · MSCI','gold_eur':'Goud','wage':'Industriële uurlonen · België','price':'S&P 500 · zonder dividenden','total':'S&P 500 · herbelegde dividenden'}
col={'m3_ea_bn':'#355c49','gdp_be_bn':'#355c49','debt_be_bn':'#a06e44','household_debt_be_bn':'#426c93','company_debt_be_bn':'#80608b','cpi_be':'#9a7a27','wage_be_eur':'#426c93','house_index_be':'#a06e44','msci_eur':'#355c49','gold_eur':'#a47731','power':'#a06e44','wage':'#a06e44','price':'#426c93','total':'#355c49'}
mapkeys={'m3':'m3_ea_bn','debt_be':'debt_be_bn','household_be':'household_debt_be_bn','company_be':'company_debt_be_bn','cpi':'cpi_be','gdp_be':'gdp_be_bn','wage':'wage_be_eur','house_index':'house_index_be','equity':'msci_eur','gold':'gold_eur'}
def fmt(v):return f'{v:,.1f}'.replace(',',' ').replace('.',',')
def table(data,widths):
 t=Table([[P(esc(str(c)),'Cell') for c in row] for row in data],colWidths=widths,hAlign='LEFT',repeatRows=1)
 t.setStyle(TableStyle([('LINEBELOW',(0,0),(-1,0),.7,colors.HexColor(ACCENT)),('LINEBELOW',(0,1),(-1,-1),.3,colors.HexColor(LINE)),('VALIGN',(0,0),(-1,-1),'TOP'),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7),('LEFTPADDING',(0,0),(-1,-1),0)]));return t
figure_count=0
for_font={'font.family':'DejaVu Sans','font.size':8,'axes.spines.top':False,'axes.spines.right':False,'axes.spines.left':False,'axes.spines.bottom':False,'axes.labelcolor':MUTED,'xtick.color':MUTED,'ytick.color':MUTED,'figure.facecolor':'white','axes.facecolor':'white'}
plt.rcParams.update(for_font)
def figure(n):
 global figure_count
 figure_count+=1;kind=n.attrs.get('data-kind','longterm');title=txt(n.all('figcaption')[0].all('strong')[0]);series={};sample=rows
 if kind=='longterm':
  sample=long;price=total=100
  series={k:[] for k in ['wage','price','total']}
  for i,r in enumerate(sample):
   if i:price*=1+r['sp500_price_return_pct']/100;total*=1+r['sp500_total_return_pct']/100
   for k,v in [('wage',100*r['industrial_wage_index_2015']/sample[0]['industrial_wage_index_2015']),('price',price),('total',total)]:series[k].append(v)
 elif kind=='koopkracht':series={'power':[100*sample[0]['cpi_be']/r['cpi_be'] for r in sample]}
 else:
  for key in n.attrs['data-keys'].split(','):
   k=mapkeys[key];series[k]=[100*r[k]/sample[0][k] for r in sample]
 years=[r['year'] for r in sample];fig,ax=plt.subplots(figsize=(6.2,3.45));fig.subplots_adjust(left=.11,right=.98,top=.96,bottom=.25)
 for key,values in series.items():ax.plot(years,values,color=col[key],lw=1.7,label=labels.get(key,'Resterende koopkracht'))
 if kind=='longterm':ax.set_yscale('log');ax.set_ylabel('Index · logaritmische schaal')
 else:ax.set_ylim(0,max(100,max(max(v) for v in series.values()))*(1 if kind=='koopkracht' else 1.10));ax.set_ylabel('Index')
 ax.yaxis.set_major_formatter(FuncFormatter(lambda x,_:f'{x:,.0f}'.replace(',',' ')));ax.grid(axis='y',color=LINE,lw=.6);ax.tick_params(length=0,pad=6);ax.set_xlim(years[0],years[-1]);ticks=[years[0]]+[y for y in years[1:-1] if y%10==0 and y>years[0]+3 and y<years[-1]-3]+[years[-1]];ax.set_xticks(ticks)
 ax.legend(loc='upper left',bbox_to_anchor=(-.08,-.13),ncol=2,frameon=False,fontsize=6.8,handlelength=2.2,columnspacing=1.3)
 buffer=io.BytesIO();fig.savefig(buffer,format='png',dpi=230);plt.close(fig);buffer.seek(0)
 story.append(KeepTogether([Spacer(1,12),P(esc(title),'FigureTitle'),P(f'{years[0]}-{years[-1]} · {years[0]} = 100'+(' · nominaal, USD zonder wisselkoerscorrectie' if kind=='longterm' else ''),'Small'),Image(buffer,width=CW,height=CW*3.45/6.2)]))
 if kind=='gdp':
  tab=[['Schuld als % van het bbp',str(years[0]),str(years[-1])]]
  for key,label in [('debt_be_bn','Overheid'),('household_debt_be_bn','Huishoudens'),('company_debt_be_bn','Niet-financiële ondernemingen')]:tab.append([label,fmt(100*sample[0][key]/sample[0]['gdp_be_bn'])+'%',fmt(100*sample[-1][key]/sample[-1]['gdp_be_bn'])+'%'])
 else:
  tab=[['Reeks',f'Index {years[-1]}','Groei sinds '+str(years[0])]]
  for key,values in series.items():tab.append([labels.get(key,'Resterende koopkracht'),fmt(values[-1]),('+' if values[-1]>=100 else '')+fmt(values[-1]-100)+'%'])
 story.append(table(tab,[CW*.58,CW*.21,CW*.21]));story.append(Spacer(1,12))
 # Keep all explanatory notes except the alternative EA20 view.
 for child in n.children:
  if isinstance(child,Node) and child.tag=='p' and 'essay-chart-note' in child.attrs.get('class','') and 'data-area-note' not in child.attrs and 'essay-source-line' not in child.attrs.get('class',''):
   note=txt(child);note=re.sub(r'Klik op een reeks in de legenda om (?:die|haar) te verbergen of opnieuw te tonen\.','',note);story.append(P(esc(note),'Small'))
 links=[]
 def source_links(node):
  if 'data-area-note' in node.attrs:return []
  found=[node] if node.tag=='a' else []
  for child in node.children:
   if isinstance(child,Node):found.extend(source_links(child))
  return found
 for a in source_links(n):
  href=a.attrs.get('href','')
  if href.startswith('http') and (txt(a),href) not in links:links.append((txt(a),href))
 if links:
  story.append(P('Bronlinks: '+' · '.join('<link href="'+escape(url,quote=True)+'" color="#976342">'+esc(label)+'</link>' for label,url in links),'Small'))
 story.append(Spacer(1,10))
source_section=False;hcount=0

def walk(n):
 global source_section,hcount
 if n.tag=='figure':figure(n);return
 classes=n.attrs.get('class','')
 if n.tag in ['aside','script','nav','button'] or 'essay-offline' in classes:return
 if n.tag=='blockquote':
  ps=n.all('p');story.append(P(esc(txt(ps[0] if ps else n)),'Quote'));return
 if n.tag=='h1':return
 if n.tag=='h2':
  text=txt(n);source_section='Bronnen en verantwoording' in text
  if not text.startswith('Inleiding'):story.append(PageBreak())
  hcount+=1
  if 'Deel ' in text:
   m=re.match(r'(Deel [IVX]+)\s+(.*)',text);story.append(P(esc(m[1]).upper(),'Eyebrow'));heading=P(esc(m[2]),'Part')
  else:heading=P(esc(text),'Part')
  heading.tocText=text;heading.tocLevel=0;heading.bookmark='heading-'+str(hcount);story.append(heading);return
 if n.tag=='h3':
  text=txt(n);m=re.match(r'(\d+)\s+(.*)',text)
  heading=P(('<font color="'+ACCENT+'">'+m[1]+'</font>  '+esc(m[2])) if m else esc(text),'Chapter');hcount+=1;heading.tocText=text;heading.tocLevel=1;heading.bookmark='heading-'+str(hcount);story.append(heading);return
 if n.tag=='p':
  text=txt(n)
  if text:story.append(P(inline(n),'Reference' if source_section else 'Body'))
  return
 if n.tag in ['ul','ol']:
  for li in n.all('li'):story.append(P('• '+esc(txt(li))))
  return
 for child in n.children:
  if isinstance(child,Node):walk(child)
walk(article)
doc.multiBuild(story)
print(f'Created {OUT}; {figure_count} charts; {hcount} contents entries')
