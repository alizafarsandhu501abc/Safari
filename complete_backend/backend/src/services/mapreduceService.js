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
    const scriptPath = path.resolve(__dirname, '..', '..', '..', 'mapreduce', 'main.py');

    const args = [
      scriptPath,
      '--input', filePath,
      '--workers', String(workers),
      '--output-json', tempJsonPath,
    ];

    const child = spawn(pythonPath, args, {
      cwd: path.resolve(__dirname, '..', '..', '..'),
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        PYTHONPATH: path.resolve(__dirname, '..', '..', '..', '..'),
      },
    });

    let stderr = '';

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', (err) => {
      reject(new Error(`Failed to start MapReduce process: ${err.message}. Is Python installed and accessible via "${pythonPath}"?`));
    });

    child.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`MapReduce process exited with code ${code}. Stderr: ${stderr}`));
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
