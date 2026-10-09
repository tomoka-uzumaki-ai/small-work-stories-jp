"""Check the current Python interpreter and local file operations. No network or story input."""
import sys,json,importlib,uuid,tempfile,zipfile
from pathlib import Path
# The received creator kit's README documents Python 3.10+ as its supported baseline.
SUPPORTED_BASELINE=(3,10)
MODULES=('argparse','pathlib','html','shutil','struct','json','re','zlib','hashlib','uuid','zipfile','io','os','tempfile','datetime','stat','urllib.parse')
def baseline_supported(version):return tuple(version[:2])>=SUPPORTED_BASELINE
def check(directory):
    result={'format':'creator-environment-check','version':1,'python_version':'.'.join(map(str,sys.version_info[:3])),'supported_baseline':'3.10','baseline_source':'The creator kit README documents Python 3.10 or later.','checks':[],'scope':'Only this interpreter, listed standard modules and a small UTF-8 file/ZIP round trip in the selected folder. This does not run the purchased generator, examine artwork, certify rights or establish browser/EPUB/printer compatibility.'}
    def record(name,ok,reason):result['checks'].append({'name':name,'passed':bool(ok),'reason':reason})
    record('documented_python_baseline',baseline_supported(sys.version_info),'Compare the running interpreter against the kit documented support baseline.')
    for name in MODULES:
        try:importlib.import_module(name);record('module:'+name,True,'Imported successfully; no network request performed.')
        except ImportError:record('module:'+name,False,'This standard module could not be imported.')
    try:
        # TemporaryDirectory removes only the fresh folder created here, even on failure.
        with tempfile.TemporaryDirectory(prefix='creator-environment-',dir=str(directory)) as folder:
            root=Path(folder);raw='自分の物語 / Your own story\n改行とUnicodeを保つ。\n'.encode('utf-8');item=root/'読書の確認.txt'
            with item.open('xb') as f:f.write(raw)
            if item.read_bytes()!=raw:raise ValueError('readback mismatch')
            record('utf8_file_roundtrip',True,'A fresh UTF-8 file was written and read back unchanged.')
            archive=root/'確認.zip'
            with zipfile.ZipFile(str(archive),'x',compression=zipfile.ZIP_DEFLATED) as z:z.writestr('読書の確認.txt',raw)
            with zipfile.ZipFile(str(archive)) as z:
                if z.testzip() is not None or z.read('読書の確認.txt')!=raw:raise ValueError('ZIP mismatch')
            record('unicode_zip_roundtrip',True,'A fresh ZIP with a Unicode entry was read back unchanged.')
        record('temporary_cleanup',True,'The fresh temporary folder was removed.')
    except (OSError,ValueError,zipfile.BadZipFile):record('local_file_roundtrip',False,'The small local write/read/ZIP or cleanup operation failed. Try a folder where you can write. Existing files were not selected for deletion.')
    result['status']='checked' if all(c['passed'] for c in result['checks']) else 'requirements_unresolved'
    return result
def main():
    import argparse
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--directory',default='.',help='A folder where you can create a fresh report and temporary files.');args=parser.parse_args();directory=Path(args.directory)
    result=check(directory);name='creator-environment-result-'+uuid.uuid4().hex[:12]+'.json'
    try:
        with (directory/name).open('x',encoding='utf-8') as f:f.write(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    except OSError:
        print(json.dumps(result,ensure_ascii=False,indent=2));print('Report could not be saved. Choose a writable folder with --directory.');return 1
    print('Result: '+result['status']);print('Saved: '+name);print('This result covers only the checks listed in the report.');return 0 if result['status']=='checked' else 1
if __name__=='__main__':sys.exit(main())
