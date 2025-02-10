import React, { useState, useEffect } from 'react';
import { Plus, Vote, FileText, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const PollSystem = () => {
  const [polls, setPolls] = useState([]);
  const [currentView, setCurrentView] = useState('list');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // States for creating new poll
  const [newPoll, setNewPoll] = useState({
    title: '',
    description: '',
    isAnonymous: true,
    options: ['', '']
  });

  const fetchPolls = async () => {
    try {
      const response = await fetch('/api/polls');
      const data = await response.json();
      setPolls(data);
    } catch (err) {
      setError('Failed to fetch polls');
    }
  };

  useEffect(() => {
    fetchPolls();
  }, []);

  const handleCreatePoll = async (e) => {
    e.preventDefault();
    try {
      const filteredOptions = newPoll.options.filter(opt => opt.trim() !== '');
      if (filteredOptions.length < 2) {
        setError('Please add at least two options');
        return;
      }

      const response = await fetch('/api/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newPoll,
          options: filteredOptions
        })
      });

      if (!response.ok) throw new Error('Failed to create poll');

      setSuccess('Poll created successfully!');
      setCurrentView('list');
      fetchPolls();
      setNewPoll({
        title: '',
        description: '',
        isAnonymous: true,
        options: ['', '']
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleVote = async (pollId, optionIndex) => {
    try {
      const response = await fetch(`/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionIndex })
      });

      if (!response.ok) throw new Error('Failed to record vote');

      setSuccess('Vote recorded successfully!');
      fetchPolls();
    } catch (err) {
      setError(err.message);
    }
  };

  const CreatePollForm = () => (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Create New Poll</h2>
      <form onSubmit={handleCreatePoll}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              required
              className="w-full p-2 border rounded"
              value={newPoll.title}
              onChange={e => setNewPoll({...newPoll, title: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              className="w-full p-2 border rounded"
              value={newPoll.description}
              onChange={e => setNewPoll({...newPoll, description: e.target.value})}
            />
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={newPoll.isAnonymous}
                onChange={e => setNewPoll({...newPoll, isAnonymous: e.target.checked})}
              />
              <span className="text-sm font-medium">Anonymous Poll</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Options</label>
            <div className="space-y-2">
              {newPoll.options.map((option, index) => (
                <div key={index} className="flex space-x-2">
                  <input
                    type="text"
                    className="flex-1 p-2 border rounded"
                    value={option}
                    onChange={e => {
                      const newOptions = [...newPoll.options];
                      newOptions[index] = e.target.value;
                      setNewPoll({...newPoll, options: newOptions});
                    }}
                    placeholder={`Option ${index + 1}`}
                  />
                  {newPoll.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newOptions = newPoll.options.filter((_, i) => i !== index);
                        setNewPoll({...newPoll, options: newOptions});
                      }}
                      className="p-2 text-red-600 hover:text-red-800"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setNewPoll({
                  ...newPoll,
                  options: [...newPoll.options, '']
                })}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
              >
                <Plus size={20} />
                <span>Add Option</span>
              </button>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => setCurrentView('list')}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Create Poll
            </button>
          </div>
        </div>
      </form>
    </div>
  );

  const PollList = () => (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Active Polls</h2>
        <button
          onClick={() => setCurrentView('create')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Create Poll</span>
        </button>
      </div>

      <div className="space-y-4">
        {polls.map(poll => (
          <div key={poll.id} className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">{poll.title}</h3>
            <p className="text-gray-600 mb-4">{poll.description}</p>
            
            <div className="space-y-2">
              {poll.options.map((option, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span>{option.text}</span>
                      <span className="text-gray-600">
                        {option.votes} votes ({option.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded-full mt-1">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${option.percentage}%` }}
                      />
                    </div>
                  </div>
                  {poll.votingOpen && (
                    <button
                      onClick={() => handleVote(poll.id, index)}
                      className="ml-4 p-2 text-blue-600 hover:text-blue-800"
                    >
                      <Vote size={20} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {poll.votingOpen && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => window.location.href = `/api/polls/${poll.id}/export`}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
                >
                  <FileText size={20} />
                  <span>Export Results</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {currentView === 'create' ? <CreatePollForm /> : <PollList />}
    </div>
  );
};

export default PollSystem;
