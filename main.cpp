#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <fstream>
#include <limits>
#include <sstream>
#include <numeric>  // Added for accumulate
#include <memory>   // Added for unique_ptr
#include <iomanip>  // Added for setprecision

using namespace std;

class Poll {
private:
    string title;
    string description;
    vector<string> options;
    vector<int> votes;
    bool isAnonymous;
    bool votingOpen;

public:
    // Added explicit constructor
    explicit Poll(string t, string desc, bool anonymous = true) : 
        title(std::move(t)), 
        description(std::move(desc)), 
        isAnonymous(anonymous), 
        votingOpen(true) {}

    // Added move constructor and assignment operator
    Poll(Poll&& other) noexcept = default;
    Poll& operator=(Poll&& other) noexcept = default;

    // Prevent copying to avoid vote count issues
    Poll(const Poll&) = delete;
    Poll& operator=(const Poll&) = delete;

    void addOption(string option) {
        if (!votingOpen) {
            throw runtime_error("Cannot add options to a closed poll");
        }
        options.push_back(std::move(option));
        votes.push_back(0);
    }

    bool vote(size_t optionIndex) {
        if (!votingOpen) {
            return false;
        }
        if (optionIndex >= options.size()) {
            return false;
        }
        votes[optionIndex]++;
        return true;
    }

    void closePoll() {
        votingOpen = false;
    }

    void displayResults() const {
        cout << "\nPoll Results: " << title << endl;
        cout << "Description: " << description << endl;
        cout << "Status: " << (votingOpen ? "Open" : "Closed") << endl;
        cout << "Anonymous: " << (isAnonymous ? "Yes" : "No") << endl;
        cout << "-------------------------" << endl;
        
        const int totalVotes = accumulate(votes.begin(), votes.end(), 0);
        for (size_t i = 0; i < options.size(); ++i) {
            const double percentage = totalVotes > 0 ? 
                (votes[i] * 100.0) / totalVotes : 0.0;
            
            cout << "[" << (i+1) << "] " << options[i] << ": ";
            cout << string(votes[i], '*') << " (" << votes[i] 
                 << " votes, " << fixed << setprecision(1) 
                 << percentage << "%)" << endl;
        }
    }

    void exportResults(const string& filename) const {
        ofstream file(filename);
        if (!file) {
            throw runtime_error("Unable to open file: " + filename);
        }

        file << "Poll Title: " << title << "\n";
        file << "Description: " << description << "\n";
        const int totalVotes = accumulate(votes.begin(), votes.end(), 0);
        file << "Total Votes: " << totalVotes << "\n\n";
        file << "Option,Votes,Percentage\n";
        
        for (size_t i = 0; i < options.size(); ++i) {
            const double percentage = totalVotes > 0 ? 
                (votes[i] * 100.0) / totalVotes : 0.0;
            
            // Properly escape CSV
            string escapedOption = options[i];
            if (escapedOption.find(',') != string::npos || 
                escapedOption.find('"') != string::npos) {
                // Replace " with "" for CSV escaping
                string::size_type pos = 0;
                while ((pos = escapedOption.find('"', pos)) != string::npos) {
                    escapedOption.replace(pos, 1, "\"\"");
                    pos += 2;
                }
                file << "\"" << escapedOption << "\",";
            } else {
                file << escapedOption << ",";
            }
            file << votes[i] << "," << fixed << setprecision(1) 
                 << percentage << "%\n";
        }
    }

    bool isVotingOpen() const { return votingOpen; }
    const vector<string>& getOptions() const { return options; }
    string getTitle() const { return title; }
};

class PollSystem {
private:
    vector<unique_ptr<Poll>> polls;

    static void clearInput() {
        cin.clear();
        cin.ignore(numeric_limits<streamsize>::max(), '\n');
    }

    static bool getYesNoInput(const string& prompt) {
        string input;
        while (true) {
            cout << prompt << " (y/n): ";
            getline(cin, input);
            transform(input.begin(), input.end(), input.begin(), ::tolower);
            if (input == "y" || input == "yes") return true;
            if (input == "n" || input == "no") return false;
            cout << "Please enter 'y' or 'n'\n";
        }
    }

public:
    void createPoll() {
        string title, desc;
        
        cout << "\nCreate New Poll\n";
        cout << "Enter poll title: ";
        getline(cin, title);
        
        if (title.empty()) {
            throw runtime_error("Poll title cannot be empty");
        }
        
        cout << "Enter poll description: ";
        getline(cin, desc);
        
        bool anonymous = getYesNoInput("Make poll anonymous?");

        polls.push_back(make_unique<Poll>(title, desc, anonymous));
        cout << "Poll created successfully!\n";
    }

    void addOptionsToPoll() {
        if (polls.empty()) {
            throw runtime_error("No polls available");
        }

        Poll& currentPoll = *polls.back();
        if (!currentPoll.isVotingOpen()) {
            throw runtime_error("Voting is closed for this poll");
        }

        cout << "\nAdd Options to Poll: " << currentPoll.getTitle() << "\n";
        cout << "(Enter an empty line to finish)\n";

        string option;
        while (true) {
            cout << "Enter option text: ";
            getline(cin, option);
            if (option.empty()) break;
            currentPoll.addOption(std::move(option));
        }
    }

    void conductVoting() {
        if (polls.empty()) {
            throw runtime_error("No polls available");
        }

        Poll& currentPoll = *polls.back();
        if (!currentPoll.isVotingOpen()) {
            throw runtime_error("Voting is closed for this poll");
        }

        const vector<string>& options = currentPoll.getOptions();
        if (options.empty()) {
            throw runtime_error("No options available in this poll");
        }

        cout << "\nCurrent Poll:\n";
        currentPoll.displayResults();
        
        while (true) {
            cout << "\nEnter option number to vote (0 to exit): ";
            string input;
            getline(cin, input);
            
            if (input == "0") break;
            
            try {
                size_t choice = stoul(input);
                if (choice < 1 || choice > options.size()) {
                    cout << "Invalid option. Please enter between 1-" 
                         << options.size() << "\n";
                    continue;
                }
                
                if (currentPoll.vote(choice - 1)) {
                    cout << "Vote recorded successfully!\n";
                } else {
                    cout << "Failed to record vote!\n";
                }
            } catch (const exception&) {
                cout << "Invalid input. Please enter a number.\n";
            }
        }
    }

    void managePolls() {
        while (true) {
            try {
                cout << "\nPoll Management System\n";
                cout << "1. Create New Poll\n";
                cout << "2. Add Options to Current Poll\n";
                cout << "3. Conduct Voting\n";
                cout << "4. View Current Poll Results\n";
                cout << "5. Export Results\n";
                cout << "6. Close Current Poll\n";
                cout << "7. Return to Main Menu\n";
                cout << "Enter choice: ";

                string input;
                getline(cin, input);
                
                if (input.empty()) continue;
                
                const int choice = stoi(input);
                
                switch (choice) {
                    case 1:
                        createPoll();
                        break;
                    case 2:
                        addOptionsToPoll();
                        break;
                    case 3:
                        conductVoting();
                        break;
                    case 4:
                        if (polls.empty()) {
                            throw runtime_error("No polls available");
                        }
                        polls.back()->displayResults();
                        break;
                    case 5:
                        if (polls.empty()) {
                            throw runtime_error("No polls available");
                        }
                        cout << "Enter filename to export: ";
                        getline(cin, input);
                        if (!input.empty()) {
                            polls.back()->exportResults(input);
                        }
                        break;
                    case 6:
                        if (polls.empty()) {
                            throw runtime_error("No polls available");
                        }
                        polls.back()->closePoll();
                        cout << "Current poll closed!\n";
                        break;
                    case 7:
                        return;
                    default:
                        cout << "Invalid choice!\n";
                }
            } catch (const exception& e) {
                cout << "Error: " << e.what() << endl;
            }
        }
    }
};

int main() {
    try {
        PollSystem system;
        
        while (true) {
            cout << "\nMain Menu\n";
            cout << "1. Manage Polls\n";
            cout << "2. Exit\n";
            cout << "Enter choice: ";

            string input;
            getline(cin, input);
            
            if (input.empty()) continue;
            
            try {
                const int choice = stoi(input);
                
                switch (choice) {
                    case 1:
                        system.managePolls();
                        break;
                    case 2:
                        cout << "Exiting program...\n";
                        return 0;
                    default:
                        cout << "Invalid choice!\n";
                }
            } catch (const invalid_argument&) {
                cout << "Please enter a valid number.\n";
            }
        }
    } catch (const exception& e) {
        cerr << "Fatal error: " << e.what() << endl;
        return 1;
    }
}
