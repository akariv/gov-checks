import codecs
from pathlib import Path

if __name__ == '__main__':
    path = Path('countries').glob('*.svg')
    out = Path('projects/gov-cnb/src/app/flags.ts')
    country_names = []
    with out.open('w') as ts:
        ts.write('export const flags: any = {\n')
        for flag in path:
            country_name = flag.name.split('.')[0].split('=')[1]
            svg = flag.read_text()
            # encode to single line data url, without newlines
            data_url = 'data:image/svg+xml;base64,' + codecs.encode(svg.encode('utf-8'), 'base64').decode('utf-8')
            data_url = data_url.replace('\n', '')
            ts.write(f"  '{country_name}': '{data_url}',\n")
            country_names.append(country_name)
        ts.write('};\n\n')
        ts.write('export const flag_names = [\n')
        for country_name in sorted(country_names):
            ts.write(f"  '{country_name}',\n")
        ts.write('];\n')


            
        
