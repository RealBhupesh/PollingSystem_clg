const express = require('express');
const { spawn } = require('child_process');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());

// Path to your compiled C++ executable
const POLL_SYSTEM_PATH = './poll_system';

// Helper function to run C++ commands
const runCommand = (args) => {
  return new Promise((resolve, reject) => {
    const process = spawn(POLL_SYSTEM_PATH, args);
    let output = '';
    let error = '';

    process.stdout.on('data', (data) => {
      output += data.toString();
    });

    process.stderr.on('data', (data) => {
      error += data.toString();
    });

    process.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(error || 'Command failed'));
      } else {
        resolve(output);
      }
    });
  });
};

// Get all polls
app.get('/api/polls', async (req, res) => {
  try {
    const output = await runCommand(['list']);
    const polls = JSON.parse(output);
    res.json(polls);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new poll
app.post('/api/polls', async (req, res) => {
  try {
    const { title, description, isAnonymous, options } = req.body;
    
    // Create poll file with required format
    const pollData = JSON.stringify({
      title,
      description,
      isAnonymous,
      options
    });

    await runCommand(['create', pollData]);
    res.json({ message: 'Poll created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Vote on a poll
app.post('/api/polls/:id/vote', async (req, res) => {
  try {
    const { id } = req.params;
    const { optionIndex } = req.body;
    
    await runCommand(['vote', id, optionIndex.toString()]);
    res.json({ message: 'Vote recorded successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export poll results
app.get('/api/polls/:id/export', async (req, res) => {
  try {
    const { id } = req.params;
    const output = await runCommand(['export', id]);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=poll_${id}_results.csv`);
    res.send(output);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
