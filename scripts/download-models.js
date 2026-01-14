const fs = require('fs');
const path = require('path');
const https = require('https');

const modelsUrl = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
const models = [
    'tiny_face_detector_model-weights_manifest.json',
    'tiny_face_detector_model-shard1',
    'face_landmark_68_model-weights_manifest.json',
    'face_landmark_68_model-shard1',
    'face_expression_model-weights_manifest.json',
    'face_expression_model-shard1'
];

const targetDir = path.join(process.cwd(), 'public', 'models');

if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

function downloadFile(filename) {
    const url = `${modelsUrl}/${filename}`;
    const filePath = path.join(targetDir, filename);

    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filePath);
        https.get(url, (response) => {
            if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    console.log(`Downloaded: ${filename}`);
                    resolve();
                });
            } else if (response.statusCode === 302 || response.statusCode === 301) {
                // Handle simple redirect (though raw github usually doesn't need complex ones)
                https.get(response.headers.location, (redirectResponse) => {
                    redirectResponse.pipe(file);
                    file.on('finish', () => {
                        file.close();
                        console.log(`Downloaded (Redirect): ${filename}`);
                        resolve();
                    });
                }).on('error', reject);
            } else {
                reject(`Failed to download ${filename}: ${response.statusCode}`);
            }
        }).on('error', (err) => {
            fs.unlink(filePath, () => { });
            reject(err.message);
        });
    });
}

async function main() {
    console.log("Downloading face-api models to " + targetDir + "...");
    for (const model of models) {
        try {
            await downloadFile(model);
        } catch (error) {
            console.error(error);
        }
    }
    console.log("All models downloaded!");
}

main();
