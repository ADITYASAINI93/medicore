#include <iostream>
#include <fstream>
#include <vector>
#include <string>
#include <iomanip>
#include <sstream>
#include <algorithm>

using namespace std;

struct Patient {
    string id;
    string name;
    int age;
    string gender;
    string ailment;
    string priority; // Emergency, VIP, Regular
    string status;   // Waiting, Doctor Assigned, In Consultation, Completed
    string assignedDoctor;
    string bookingTime;
};

struct Doctor {
    string id;
    string name;
    string department;
    string status; // Available, Busy, In Surgery, Off Duty
    int consultationFee;
    double rating;
    int experienceYears;
};

class HospitalManagementSystem {
private:
    vector<Patient> patients;
    vector<Doctor> doctors;
    string dbFilename;

public:
    HospitalManagementSystem(const string& dbFile = "hospital_db.txt") : dbFilename(dbFile) {
        loadDatabase();
        if (doctors.empty()) {
            seedDefaultData();
        }
    }

    void seedDefaultData() {
        doctors = {
            {"DOC-01", "Dr. Sarah Smith", "Cardiology", "Available", 800, 4.9, 14},
            {"DOC-02", "Dr. Michael Chen", "Neurology", "In Surgery", 1200, 4.8, 18},
            {"DOC-03", "Dr. Emily Davis", "Pediatrics", "Available", 600, 4.7, 10},
            {"DOC-04", "Dr. James Wilson", "Orthopedics", "Busy", 900, 4.9, 16},
            {"DOC-05", "Dr. Aisha Patel", "General Medicine", "Available", 500, 4.9, 12},
            {"DOC-06", "Dr. Robert Taylor", "Dermatology", "Off Duty", 700, 4.6, 9}
        };

        patients = {
            {"PT-1001", "John Doe", 42, "Male", "Severe chest pain & shortness of breath", "Emergency", "Doctor Assigned", "Dr. Sarah Smith", "10:15 AM"},
            {"PT-1002", "Eleanor Vance", 29, "Female", "Migraine and visual auras", "VIP", "Waiting", "Dr. Michael Chen", "10:30 AM"},
            {"PT-1003", "David Miller", 55, "Male", "Knee joint inflammation", "Regular", "Waiting", "Dr. James Wilson", "10:45 AM"},
            {"PT-1004", "Sophia Grace", 8, "Female", "High viral fever & cough", "Emergency", "Waiting", "Dr. Emily Davis", "11:00 AM"},
            {"PT-1005", "Marcus Brown", 34, "Male", "Routine annual health consultation", "Regular", "Waiting", "Dr. Aisha Patel", "11:15 AM"}
        };
        saveDatabase();
    }

    void loadDatabase() {
        ifstream file(dbFilename);
        if (!file.is_open()) return;

        string line;
        string section = "";
        while (getline(file, line)) {
            if (line.empty() || line[0] == '#') {
                if (line.find("[DOCTORS]") != string::npos) section = "DOCTORS";
                if (line.find("[PATIENTS]") != string::npos) section = "PATIENTS";
                continue;
            }

            stringstream ss(line);
            string token;
            vector<string> tokens;
            while (getline(ss, token, '|')) {
                tokens.push_back(token);
            }

            if (section == "DOCTORS" && tokens.size() >= 7) {
                Doctor d;
                d.id = tokens[0];
                d.name = tokens[1];
                d.department = tokens[2];
                d.status = tokens[3];
                d.consultationFee = stoi(tokens[4]);
                d.rating = stod(tokens[5]);
                d.experienceYears = stoi(tokens[6]);
                doctors.push_back(d);
            } else if (section == "PATIENTS" && tokens.size() >= 9) {
                Patient p;
                p.id = tokens[0];
                p.name = tokens[1];
                p.age = stoi(tokens[2]);
                p.gender = tokens[3];
                p.ailment = tokens[4];
                p.priority = tokens[5];
                p.status = tokens[6];
                p.assignedDoctor = tokens[7];
                p.bookingTime = tokens[8];
                patients.push_back(p);
            }
        }
        file.close();
    }

    void saveDatabase() {
        ofstream file(dbFilename);
        if (!file.is_open()) return;

        file << "# MediCore Hospital Management System Database\n\n";
        file << "[DOCTORS]\n";
        file << "# ID|Name|Department|Status|Fee|Rating|Experience\n";
        for (const auto& d : doctors) {
            file << d.id << "|" << d.name << "|" << d.department << "|" << d.status << "|"
                 << d.consultationFee << "|" << d.rating << "|" << d.experienceYears << "\n";
        }

        file << "\n[PATIENTS]\n";
        file << "# ID|Name|Age|Gender|Ailment|Priority|Status|AssignedDoctor|BookingTime\n";
        for (const auto& p : patients) {
            file << p.id << "|" << p.name << "|" << p.age << "|" << p.gender << "|"
                 << p.ailment << "|" << p.priority << "|" << p.status << "|"
                 << p.assignedDoctor << "|" << p.bookingTime << "\n";
        }
        file.close();
    }

    void addPatient(const Patient& p) {
        patients.push_back(p);
        saveDatabase();
        cout << "[SUCCESS] Patient " << p.id << " registered successfully in MediCore system.\n";
    }

    void listQueue() {
        cout << "\n============================== CURRENT QUEUE ==============================\n";
        cout << left << setw(10) << "ID" << setw(18) << "Name" << setw(12) << "Priority"
             << setw(16) << "Status" << setw(20) << "Assigned Doctor" << "\n";
        cout << "---------------------------------------------------------------------------\n";
        for (const auto& p : patients) {
            if (p.status != "Completed") {
                cout << left << setw(10) << p.id << setw(18) << p.name << setw(12) << p.priority
                     << setw(16) << p.status << setw(20) << p.assignedDoctor << "\n";
            }
        }
        cout << "===========================================================================\n\n";
    }

    void listDoctors() {
        cout << "\n=========================== DOCTOR DIRECTORY ===========================\n";
        cout << left << setw(10) << "ID" << setw(20) << "Name" << setw(18) << "Department"
             << setw(14) << "Status" << setw(10) << "Fee (INR)" << "\n";
        cout << "------------------------------------------------------------------------\n";
        for (const auto& d : doctors) {
            cout << left << setw(10) << d.id << setw(20) << d.name << setw(18) << d.department
                 << setw(14) << d.status << "INR " << d.consultationFee << "\n";
        }
        cout << "========================================================================\n\n";
    }

    void assignDoctor(const string& patientId, const string& doctorName) {
        bool found = false;
        for (auto& p : patients) {
            if (p.id == patientId) {
                p.assignedDoctor = doctorName;
                p.status = "Doctor Assigned";
                found = true;
                break;
            }
        }
        if (found) {
            saveDatabase();
            cout << "[SUCCESS] Doctor " << doctorName << " successfully assigned to " << patientId << "\n";
        } else {
            cout << "[ERROR] Patient " << patientId << " not found.\n";
        }
    }
};

int main(int argc, char* argv[]) {
    HospitalManagementSystem hms;

    if (argc > 1) {
        string cmd = argv[1];
        if (cmd == "--queue") {
            hms.listQueue();
        } else if (cmd == "--doctors") {
            hms.listDoctors();
        } else if (cmd == "--assign" && argc >= 4) {
            hms.assignDoctor(argv[2], argv[3]);
        } else {
            cout << "Usage: hospital.exe [--queue | --doctors | --assign <patientId> <doctorName>]\n";
        }
        return 0;
    }

    cout << "=====================================================\n";
    cout << "      MediCore Smart Hospital Management Core        \n";
    cout << "=====================================================\n";
    hms.listQueue();
    hms.listDoctors();
    return 0;
}
