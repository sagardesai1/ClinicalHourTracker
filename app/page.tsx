"use client";

import { useEffect, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  increment,
  doc,
  updateDoc,
  setDoc,
  getDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import { db } from "@/firebase";
import { useUser } from "@clerk/nextjs";
import useFirebaseAuthToken from "@/hooks/useFirebaseAuthToken";
import { useToast } from "@/hooks/use-toast";

interface HourData {
  direct?: {
    directHours?: number; // Optional property for direct hours
    clientConcerns?: string; // Other properties specific to direct
    date?: Date; // Optional property for date
    diagnosis?: string; // Other properties
    modality?: string; // Other properties
    population?: string; // Other properties
    setting?: string; // Other properties
  };
  indirect?: {
    indirectHours?: number; // Optional property for indirect hours
    date?: Date; // Optional property for date
    hourType?: string; // Other properties specific to indirect
  };
  supervision?: {
    supervisionHours?: number; // Optional property for supervision hours
    date?: Date; // Optional property for date
    hourType?: string; // Other properties specific to supervision
  };
}

// Mock data for dropdown options
const modalities = ["In-person", "Telehealth", "Phone"];
const populations = ["Adults", "Children", "Adolescents", "Elderly"];
const settings = ["Private Practice", "Hospital", "Community Center", "School"];
const diagnoses = ["Depression", "Anxiety", "PTSD", "Substance Abuse", "Other"];

const TOTAL_CLINICAL_HOURS = 3000; // Example requirement
const TOTAL_INDIRECT_HOURS = 500; // Example requirement
const TOTAL_SUPERVISION_HOURS = 100; // Example requirement

export default function ClinicalHourTracker() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [hourType, setHourType] = useState("");
  const [hourData, setHourData] = useState<HourData | null>(null);

  const [editingData, setEditingData] = useState<any>(null);
  const { user } = useUser();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    sessionType: "",
    modality: "",
    population: "",
    supervisionType: "",
    setting: "",
    diagnosis: "",
    duration: "",
    directHours: "",
    indirectHours: "",
    supervisorName: "",
    supervisionHours: "",
    topicsDiscussed: "",
    clientConcerns: "",
  });
  const remainingClinicalHours =
    TOTAL_CLINICAL_HOURS - (parseFloat(formData.directHours) || 0);
  const remainingIndirectHours =
    TOTAL_INDIRECT_HOURS - (parseFloat(formData.indirectHours) || 0);
  const remainingSupervisionHours =
    TOTAL_SUPERVISION_HOURS - (parseFloat(formData.supervisionHours) || 0);

  useFirebaseAuthToken();

  useEffect(() => {
    const fetchHourData = async () => {
      if (!user || !selectedDate) return;

      // Reference the 'hours' subcollection for the selected date
      const hoursCollectionRef = collection(
        db,
        "users",
        user.id,
        "dates",
        selectedDate.toDateString(),
        "hours"
      );

      try {
        // Fetch all documents within the 'hours' subcollection
        const hourDataSnapshot = await getDocs(hoursCollectionRef);

        if (!hourDataSnapshot.empty) {
          const fetchedHourData: { [key: string]: HourData } = {}; // Initialize with type

          hourDataSnapshot.forEach((doc) => {
            fetchedHourData[doc.id] = doc.data() as HourData; // Collect each hour type's data
          });

          setHourData(fetchedHourData); // Set all hour types' data for the selected date
        } else {
          setHourData(null); // No data found for this date
        }
      } catch (error) {
        console.error("Error fetching hour data: ", error);
      }
    };

    fetchHourData();
  }, [selectedDate, user]);

  const handleSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !selectedDate || !hourType) {
      return;
    }

    const userTotalDocRef = doc(db, "users", user.id);
    const hourTypeDocRef = doc(
      db,
      "users",
      user.id,
      "dates",
      selectedDate.toDateString(),
      "hours",
      hourType
    );

    try {
      // Fetch the existing hours data for the selected date
      const hourTypeDocSnap = await getDoc(hourTypeDocRef);
      let previousHours = 0;

      if (hourTypeDocSnap.exists()) {
        previousHours = hourTypeDocSnap.data()?.[`${hourType}Hours`] || 0; // Get the existing hours
      }

      // Define the data to save
      let dataToSave: any = { date: selectedDate, hourType };

      // Calculate differences for updating totals
      let hoursDifference = 0;
      let incrementData = {
        totalDirectHours: 0,
        totalIndirectHours: 0,
        totalSupervisionHours: 0,
      };

      if (hourType === "supervision") {
        const newHours = parseFloat(formData.supervisionHours) || 0;
        hoursDifference = newHours - previousHours;

        dataToSave = {
          ...dataToSave,
          modality: formData.modality,
          population: formData.population,
          setting: formData.setting,
          diagnosis: formData.diagnosis,
          supervisionHours: newHours,
          supervisorName: formData.supervisorName,
          topicsDiscussed: formData.topicsDiscussed,
          clientConcerns: formData.clientConcerns,
        };

        incrementData.totalSupervisionHours = hoursDifference; // Update supervision hours
      } else if (hourType === "direct") {
        const newHours = parseFloat(formData.directHours) || 0;
        hoursDifference = newHours - previousHours;

        dataToSave = {
          ...dataToSave,
          modality: formData.modality,
          population: formData.population,
          setting: formData.setting,
          diagnosis: formData.diagnosis,
          directHours: newHours,
          clientConcerns: formData.clientConcerns,
        };

        incrementData.totalDirectHours = hoursDifference; // Update direct hours
      } else if (hourType === "indirect") {
        const newHours = parseFloat(formData.indirectHours) || 0;
        hoursDifference = newHours - previousHours;

        dataToSave = {
          ...dataToSave,
          indirectHours: newHours,
        };

        incrementData.totalIndirectHours = hoursDifference; // Update indirect hours
      }

      // Save or update the individual hour log
      await setDoc(hourTypeDocRef, dataToSave, { merge: true });

      // Check if the user total document exists
      const userTotalDocSnap = await getDoc(userTotalDocRef);

      // If the document doesn't exist, create it with initial totals, otherwise update the totals
      if (!userTotalDocSnap.exists()) {
        await setDoc(userTotalDocRef, {
          totalDirectHours: incrementData.totalDirectHours,
          totalIndirectHours: incrementData.totalIndirectHours,
          totalSupervisionHours: incrementData.totalSupervisionHours,
        });
      } else {
        await updateDoc(userTotalDocRef, {
          totalDirectHours: increment(incrementData.totalDirectHours),
          totalIndirectHours: increment(incrementData.totalIndirectHours),
          totalSupervisionHours: increment(incrementData.totalSupervisionHours),
        });
      }

      toast({
        title: "Successfully submitted hours!",
      });

      console.log("Data and totals successfully updated!");
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Clinical Hour Tracker</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex-1 h-[650px] w-full">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(newDate) => {
              setDate(newDate);
              handleSelect(newDate ?? new Date());
            }}
            className="h-full w-full flex border md-rounded"
            classNames={{
              months:
                "flex w-full flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 flex-1",
              month: "space-y-4 w-full flex flex-col",
              table: "w-full h-full border-collapse space-y-1",
              head_row: "",
              row: "w-full mt-2",
            }}
          />
          {/* <div className="mt-4 p-4 border rounded-lg">
            <h2 className="text-lg font-semibold">
              Hours Left to Obtain License:
            </h2>
            <p>
              Clinical Hours Left:{" "}
              {remainingClinicalHours < 0 ? 0 : remainingClinicalHours}
            </p>
            <p>
              Indirect Hours Left:{" "}
              {remainingIndirectHours < 0 ? 0 : remainingIndirectHours}
            </p>
            <p>
              Supervision Hours Left:{" "}
              {remainingSupervisionHours < 0 ? 0 : remainingSupervisionHours}
            </p>
          </div> */}
        </div>
        <div>
          {selectedDate && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-xl font-semibold">
                Log Hours for {selectedDate.toDateString()}
              </h2>

              {!hourType && ( // Ensure hourData exists
                <>
                  {/* Direct Clinical Hours */}
                  <div className="space-y-2">
                    <Label htmlFor="directHours">Direct Clinical Hours</Label>
                    <div
                      className={`border rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-all ${
                        hourData?.direct?.directHours
                          ? "bg-green-50"
                          : "bg-white"
                      }`}
                      onClick={() => setHourType("direct")}
                    >
                      {hourData?.direct?.directHours ? ( // Check if directHours exists
                        <div>
                          <p className="font-semibold">
                            Logged Hours: {hourData.direct?.directHours}
                          </p>
                          <Button>Edit</Button>
                        </div>
                      ) : (
                        <Button>Add Direct Hours</Button>
                      )}
                    </div>
                  </div>

                  {/* Indirect Hours */}
                  <div className="space-y-2">
                    <Label htmlFor="indirectHours">Indirect Hours</Label>
                    <div
                      className={`border rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-all ${
                        hourData?.indirect?.indirectHours
                          ? "bg-green-50"
                          : "bg-white"
                      }`}
                      onClick={() => setHourType("indirect")}
                    >
                      {hourData?.indirect?.indirectHours !== undefined ? ( // Check if indirectHours exists
                        <div>
                          <p className="font-semibold">
                            Logged Hours: {hourData.indirect?.indirectHours}
                          </p>
                          <Button>Edit</Button>
                        </div>
                      ) : (
                        <Button>Add Indirect Hours</Button>
                      )}
                    </div>
                  </div>

                  {/* Supervision Hours */}
                  <div className="space-y-2">
                    <Label htmlFor="supervisionHours">Supervision Hours</Label>
                    <div
                      className={`border rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-all ${
                        hourData?.supervision?.supervisionHours
                          ? "bg-green-50"
                          : "bg-white"
                      }`}
                      onClick={() => setHourType("supervision")}
                    >
                      {hourData?.supervision?.supervisionHours !== undefined ? ( // Check if supervisionHours exists
                        <div>
                          <p className="font-semibold">
                            Logged Hours:{" "}
                            {hourData.supervision?.supervisionHours}
                          </p>
                          <Button>Edit</Button>
                        </div>
                      ) : (
                        <Button>Add Supervision Hours</Button>
                      )}
                    </div>
                  </div>
                </>
              )}

              {hourType === "direct" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="modality">Modality</Label>
                    <Select
                      name="modality"
                      value={formData.modality}
                      onValueChange={(value) =>
                        handleSelectChange("modality", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select modality" />
                      </SelectTrigger>
                      <SelectContent>
                        {modalities.map((modality) => (
                          <SelectItem key={modality} value={modality}>
                            {modality}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="population">Population</Label>
                    <Select
                      name="population"
                      value={formData.population}
                      onValueChange={(value) =>
                        handleSelectChange("population", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select population" />
                      </SelectTrigger>
                      <SelectContent>
                        {populations.map((population) => (
                          <SelectItem key={population} value={population}>
                            {population}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="setting">Setting/Location</Label>
                    <Select
                      name="setting"
                      value={formData.setting}
                      onValueChange={(value) =>
                        handleSelectChange("setting", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select setting" />
                      </SelectTrigger>
                      <SelectContent>
                        {settings.map((setting) => (
                          <SelectItem key={setting} value={setting}>
                            {setting}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="diagnosis">
                      Client Diagnosis/Presenting Concern
                    </Label>
                    <Select
                      name="diagnosis"
                      value={formData.diagnosis}
                      onValueChange={(value) =>
                        handleSelectChange("diagnosis", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select diagnosis" />
                      </SelectTrigger>
                      <SelectContent>
                        {diagnoses.map((diagnosis) => (
                          <SelectItem key={diagnosis} value={diagnosis}>
                            {diagnosis}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="directHours">Direct Clinical Hours</Label>
                    <Input
                      type="number"
                      id="directHours"
                      name="directHours"
                      value={formData.directHours}
                      onChange={handleInputChange}
                      placeholder="Enter direct hours"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clientConcerns">Client Concerns</Label>
                    <Textarea
                      id="clientConcerns"
                      name="clientConcerns"
                      value={formData.clientConcerns}
                      onChange={handleInputChange}
                      placeholder="Enter client concerns"
                    />
                  </div>
                </>
              )}

              {hourType === "indirect" && (
                <div className="space-y-2">
                  <Label htmlFor="indirectHours">Indirect Hours</Label>
                  <Input
                    type="number"
                    id="indirectHours"
                    name="indirectHours"
                    value={formData.indirectHours}
                    onChange={handleInputChange}
                    placeholder="Enter indirect hours"
                  />
                </div>
              )}

              {hourType === "supervision" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="modality">Modality</Label>
                    <Select
                      name="modality"
                      value={formData.modality}
                      onValueChange={(value) =>
                        handleSelectChange("modality", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select modality" />
                      </SelectTrigger>
                      <SelectContent>
                        {modalities.map((modality) => (
                          <SelectItem key={modality} value={modality}>
                            {modality}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="population">Population</Label>
                    <Select
                      name="population"
                      value={formData.population}
                      onValueChange={(value) =>
                        handleSelectChange("population", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select population" />
                      </SelectTrigger>
                      <SelectContent>
                        {populations.map((population) => (
                          <SelectItem key={population} value={population}>
                            {population}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="setting">Setting/Location</Label>
                    <Select
                      name="setting"
                      value={formData.setting}
                      onValueChange={(value) =>
                        handleSelectChange("setting", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select setting" />
                      </SelectTrigger>
                      <SelectContent>
                        {settings.map((setting) => (
                          <SelectItem key={setting} value={setting}>
                            {setting}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="diagnosis">
                      Client Diagnosis/Presenting Concern
                    </Label>
                    <Select
                      name="diagnosis"
                      value={formData.diagnosis}
                      onValueChange={(value) =>
                        handleSelectChange("diagnosis", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select diagnosis" />
                      </SelectTrigger>
                      <SelectContent>
                        {diagnoses.map((diagnosis) => (
                          <SelectItem key={diagnosis} value={diagnosis}>
                            {diagnosis}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="supervisorName">Supervisor's Name</Label>
                    <Input
                      type="text"
                      id="supervisorName"
                      name="supervisorName"
                      value={formData.supervisorName}
                      onChange={handleInputChange}
                      placeholder="Enter supervisor's name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="supervisionHours">Supervision Hours</Label>
                    <Input
                      type="number"
                      id="supervisionHours"
                      name="supervisionHours"
                      value={formData.supervisionHours}
                      onChange={handleInputChange}
                      placeholder="Enter supervision hours"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="topicsDiscussed">
                      Topics Discussed in Supervision
                    </Label>
                    <Textarea
                      id="topicsDiscussed"
                      name="topicsDiscussed"
                      value={formData.topicsDiscussed}
                      onChange={handleInputChange}
                      placeholder="Enter topics discussed"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientConcerns">Client Concerns</Label>
                    <Textarea
                      id="clientConcerns"
                      name="clientConcerns"
                      value={formData.clientConcerns}
                      onChange={handleInputChange}
                      placeholder="Enter client concerns"
                    />
                  </div>
                </>
              )}

              {hourType && <Button type="submit">Submit</Button>}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
