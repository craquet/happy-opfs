import { appendFileSync, connectSyncAgent, emptyDirSync, existsSync, mkdirSync, readBlobFileSync, readDirSync, readFileSync, readTextFileSync, removeSync, renameSync, statSync, writeFileSync, type FileSystemFileHandleLike } from '../src/mod.ts';

function run() {
    emptyDirSync('/');
    mkdirSync('/happy/opfs');
    writeFileSync('/happy/opfs/a.txt', 'hello opfs');
    renameSync('/happy/opfs/a.txt', '/happy/b.txt');
    appendFileSync('/happy/b.txt', ' happy opfs');

    const statRes = statSync('/happy/opfs/a.txt');
    console.assert(statRes.isErr());

    console.assert(readFileSync('/happy/b.txt').unwrap().byteLength === 21);
    console.assert(readBlobFileSync('/happy/b.txt').unwrap().size === 21);
    console.assert(readTextFileSync('//happy///b.txt//').unwrap() === 'hello opfs happy opfs');

    console.assert(removeSync('/happy/not/exists').unwrap());
    removeSync('/happy/opfs');

    console.assert(!existsSync('/happy/opfs').unwrap());
    console.assert(existsSync('/happy/b.txt').unwrap());

    emptyDirSync('/not-exists');

    for (const { path, handle } of readDirSync('/', {
        recursive: true,
    }).unwrap()) {
        if (handle.kind === 'file') {
            const file = handle as FileSystemFileHandleLike;
            console.log(`${ path } is a ${ handle.kind }, name = ${ handle.name }, type = ${ file.type }, size = ${ file.size }, lastModified = ${ file.lastModified }`);
        } else {
            console.log(`${ path } is a ${ handle.kind }, name = ${ handle.name }`);
        }
    }

    // Comment this line to view using OPFS Explorer
    removeSync('/');
}

export async function testSync() {
    await connectSyncAgent({
        worker: new Worker(new URL('worker.ts', import.meta.url), {
            type: 'module'
        }),
        // SharedArrayBuffer size between main thread and worker
        bufferLength: 10 * 1024 * 1024,
        // max wait time at main thread per operation
        opTimeout: 3000,
    });

    for (let index = 0; index < 1; index++) {
        run();
    }
}