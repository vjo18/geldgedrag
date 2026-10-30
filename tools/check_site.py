#!/usr/bin/env python3
"""Check committed website assets without installing a build system."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import csv
ROOT=Path(__file__).resolve().parents[1]/'docs'
class Links(HTMLParser):
 def __init__(self):super().__init__();self.links=[];self.ids=[]
 def handle_starttag(self,tag,attrs):
  attrs=dict(attrs)
  if 'id' in attrs:self.ids.append(attrs['id'])
  for key in ('href','src'):
   if key in attrs:self.links.append(attrs[key])
errors=[];pages={}
for path in ROOT.glob('*.html'):
 p=Links();p.feed(path.read_text());pages[path.name]=p
 if len(p.ids)!=len(set(p.ids)):errors.append(f'{path.name}: duplicate id')
for name,p in pages.items():
 for link in p.links:
  u=urlsplit(link)
  if u.scheme or u.netloc:continue
  target=(ROOT/unquote(u.path)) if u.path else ROOT/name
  if not target.exists():errors.append(f'{name}: missing {link}');continue
  if u.fragment and target.name in pages and u.fragment not in pages[target.name].ids:errors.append(f'{name}: missing anchor {link}')
for name in ['jaarreeksen.csv','langetermijn.csv']:
 with (ROOT/name).open() as stream:
  rows=list(csv.DictReader(stream,delimiter=';'))
 years=[int(row['year']) for row in rows]
 if len(set(years))!=len(years) or years!=sorted(years):errors.append(f'{name}: invalid year sequence')
pdf=ROOT/'essay-geldgedrag.pdf'
if not pdf.read_bytes().startswith(b'%PDF-'):errors.append('Missing or invalid essay PDF')
if (ROOT/'CNAME').read_text().strip()!='geldgedrag.be':errors.append('Unexpected custom domain')
if errors:raise SystemExit('\n'.join(errors))
print(f'Validated {len(pages)} HTML pages, local links and anchors, both CSVs, PDF and domain.')
