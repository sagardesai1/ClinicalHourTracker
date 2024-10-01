"use client";

import { useState } from "react";
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitted data:", { date: selectedDate, ...formData });
    // Here you would typically send this data to your backend
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
          <div className="mt-4 p-4 border rounded-lg">
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
          </div>
        </div>
        <div>
          {selectedDate && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-xl font-semibold">
                Log Hours for {selectedDate.toDateString()}
              </h2>

              <div className="space-y-2">
                <Label htmlFor="hourType">Hour Type</Label>
                <Select
                  name="hourType"
                  value={hourType}
                  onValueChange={(value) => setHourType(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select hour type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="supervision">
                      Supervision Hours
                    </SelectItem>
                    <SelectItem value="direct">
                      Direct Clinical Hours
                    </SelectItem>
                    <SelectItem value="indirect">Indirect Hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
                </>
              )}

              <Button type="submit">Submit</Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
