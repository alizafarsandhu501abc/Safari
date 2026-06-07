const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const config = require('../config/env');

/**
 * Run the MapReduce Python script on a given log file.
 * @param {string} filePath - Absolute path to the log file
 * @param {number} workers - Number of worker processes
 * @returns {Promise<object>} Parsed JSON results from the MapReduce output
 */
function runMapReduce(filePath, workers = 4) {
  return new Promise((resolve, reject) => {
    const tempJsonPath = path.join(
      os.tmpdir(),
      `mapreduce_result_${Date.now()}.json`
    );

    const pythonPath = config.PYTHON_PATH;
    const projectRoot = path.resolve(__dirname, '..', '..');
    const scriptPath = path.resolve(projectRoot, 'mapreduce', 'main.py');

    console.log('[MapReduce] Starting analysis...');
    console.log('[MapReduce] Python path:', pythonPath);
    console.log('[MapReduce] Script path:', scriptPath);
    console.log('[MapReduce] Script exists:', fs.existsSync(scriptPath));
    console.log('[MapReduce] Input file:', filePath);
    console.log('[MapReduce] Input exists:', fs.existsSync(filePath));
    console.log('[MapReduce] CWD:', projectRoot);
    console.log('[MapReduce] Workers:', workers);

    const args = [
      '-m', 'mapreduce.main',
      '--input', filePath,
      '--workers', String(workers),
      '--output-json', tempJsonPath,
    ];

    const child = spawn(pythonPath, args, {
      cwd: projectRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        PYTHONPATH: projectRoot,
      },
    });

    let stderr = '';
    let stdout = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', (err) => {
      reject(new Error(`Failed to start MapReduce process: ${err.message}. Is Python installed and accessible via "${pythonPath}"?`));
    });

    child.on('close', (code) => {
      console.log('[MapReduce] Process exited with code:', code);
      if (stdout) console.log('[MapReduce] stdout:', stdout);
      if (stderr) console.error('[MapReduce] stderr:', stderr);

      if (code !== 0) {
        return reject(new Error(`MapReduce process exited with code ${code}. Stderr: ${stderr}. Stdout: ${stdout}`));
      }

      try {
        const raw = fs.readFileSync(tempJsonPath, 'utf-8');
        const results = JSON.parse(raw);

        // Clean up temp file
        fs.unlink(tempJsonPath, () => {});

        resolve(results);
      } catch (err) {
        // Clean up temp file on error too
        fs.unlink(tempJsonPath, () => {});
        reject(new Error(`Failed to read MapReduce output: ${err.message}`));
      }
    });
  });
}

module.exports = { runMapReduce };
