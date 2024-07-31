import { appendFile, downloadFile, emptyDir, exists, isOPFSSupported, mkdir, readDir, readFile, readTextFile, remove, rename, stat, uploadFile, writeFile } from '../src/mod.ts';
import { mockTodo1, mockTodos } from './constants.ts';

export async function testAsync() {
    // Check if OPFS is supported
    console.log(`OPFS is${ isOPFSSupported() ? '' : ' not' } supported`);

    // Clear all files and folders
    await emptyDir('/');
    // Recursively create the /happy/opfs directory
    await mkdir('/happy/opfs');
    // Create and write file content
    await writeFile('/happy/opfs/a.txt', 'hello opfs');
    // Move the file
    await rename('/happy/opfs/a.txt', '/happy/b.txt');
    // Append content to the file
    await appendFile('/happy/b.txt', ' happy opfs');

    // File no longer exists
    const statRes = await stat('/happy/opfs/a.txt');
    console.assert(statRes.isErr());

    console.assert((await readFile('/happy/b.txt')).unwrap().byteLength === 21);
    // Automatically normalize the path
    console.assert((await readTextFile('//happy///b.txt//')).unwrap() === 'hello opfs happy opfs');

    console.assert((await remove('/happy/not/exists')).unwrap());
    await remove('/happy/opfs');

    console.assert(!(await exists('/happy/opfs')).unwrap());
    console.assert((await exists('/happy/b.txt')).unwrap());

    // Download a file
    const downloadTask = downloadFile(mockTodo1, '/todo.json', {
        timeout: 1000,
    });
    const downloadRes = await downloadTask.response;
    if (downloadRes.isOk()) {
        console.assert(downloadRes.unwrap() instanceof Response);

        const postData = (await readTextFile('/todo.json')).unwrap();
        const postJson: {
            id: number;
            title: string;
        } = JSON.parse(postData);
        console.assert(postJson.id === 1);

        // Modify the file
        postJson.title = 'happy-opfs';
        await writeFile('/todo.json', JSON.stringify(postJson));

        // Upload a file
        console.assert((await uploadFile('/todo.json', mockTodos).response).unwrap() instanceof Response);
    } else {
        console.assert(downloadRes.unwrapErr() instanceof Error);
    }

    // Will create directory
    await emptyDir('/not-exists');

    // List all files and folders in the root directory
    for await (const { path, handle } of (await readDir('/', {
        recursive: true,
    })).unwrap()) {
        /**
         * todo.json is a file
         * not-exists is a directory
         * happy is a directory
         * happy/b.txt is a file
         */
        console.log(`${ path } is a ${ handle.kind }`);
    }

    // Comment this line to view using OPFS Explorer
    await remove('/');
}