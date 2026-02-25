const { spawn } = require('child_process');
const path = require('path');

const simulate = () => {
    console.log(`[${new Date().toLocaleTimeString()}] Starting Congestion Refresh Cycle...`);

    // Use pnpm to run the already defined script in package.json
    const child = spawn('pnpm', ['cre:simulate'], {
        cwd: path.join(__dirname, '..'),
        shell: true,
        stdio: 'inherit'
    });

    child.on('close', (code) => {
        console.log(`[${new Date().toLocaleTimeString()}] Simulation finished (code ${code}). Next run in 10s...`);
        setTimeout(simulate, 10000);
    });

    child.on('error', (err) => {
        console.error(`Failed to start simulation:`, err);
        setTimeout(simulate, 10000);
    });
};

simulate();
