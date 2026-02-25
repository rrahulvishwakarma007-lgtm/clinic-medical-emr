"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Dashboard() {

  const [patients,setPatients] = useState<any[]>([]);
  const [showForm,setShowForm] = useState(false);

  const [newPatient,setNewPatient] = useState({
    name:"",
    age:"",
    type:""
  });

  // 🔵 LOAD PATIENTS
  useEffect(()=>{
    loadPatients();
  },[]);

  async function loadPatients(){
    try {
      console.log("Attempting to load patients via Internal API...");
      
      const res = await fetch("/api/patients");
      const data = await res.json();

      if (data.error) {
        console.error("API error loading patients:", JSON.stringify(data.error, null, 2));
        return;
      }

      console.log("Successfully loaded patients:", data?.length);
      setPatients(data);
    } catch (err: any) {
      console.error("Fetch exception in loadPatients:", err);
    }
  }

  // 🟢 ADD PATIENT
  async function addPatient(){

    console.log("SAVE CLICKED");

    if(!newPatient.name){
      alert("Name required");
      return;
    }

    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:newPatient.name,
          age:Number(newPatient.age) || 0,
          type:newPatient.type,
          date: new Date().toISOString(),
          status:"confirmed"
        })
      });
      
      const data = await res.json();

      if(data.error){
        alert(`Insert failed: ${data.error.message}`);
        return;
      }

      setShowForm(false);
      setNewPatient({name:"",age:"",type:""});
      loadPatients();
    } catch (err) {
      console.error("Insert exception:", err);
      alert("An unexpected error occurred. Check console.");
    }
  }

  return(
    <div style={{padding:30}}>

      <h2>Clinic Dashboard</h2>

      {/* REGISTER BUTTON */}
      <button
        onClick={()=>setShowForm(true)}
        style={{
          padding:"10px 20px",
          background:"#4f9cf9",
          color:"#fff",
          borderRadius:8,
          marginBottom:20
        }}
      >
        ＋ Register New Patient
      </button>

      {/* 🟡 FORM */}
      {showForm &&(
        <div style={{
          border:"1px solid #ddd",
          padding:20,
          borderRadius:10,
          marginBottom:20
        }}>
          <h3>Add Patient</h3>

          <input
            placeholder="Name"
            value={newPatient.name}
            onChange={e=>setNewPatient({...newPatient,name:e.target.value})}
            style={{display:"block",marginBottom:10}}
          />

          <input
            placeholder="Age"
            value={newPatient.age}
            onChange={e=>setNewPatient({...newPatient,age:e.target.value})}
            style={{display:"block",marginBottom:10}}
          />

          <input
            placeholder="Type"
            value={newPatient.type}
            onChange={e=>setNewPatient({...newPatient,type:e.target.value})}
            style={{display:"block",marginBottom:10}}
          />

          <button
            onClick={addPatient}
            style={{
              padding:"8px 14px",
              background:"#16a34a",
              color:"#fff",
              borderRadius:6
            }}
          >
            Save Patient
          </button>

        </div>
      )}

      {/* 🟣 PATIENT LIST */}
      <div>
        <h3>Patients List</h3>

        {patients.length === 0 && (
          <p>No patients yet...</p>
        )}

        {patients.map((p)=>(
          <div
            key={p.id}
            style={{
              padding:10,
              borderBottom:"1px solid #eee"
            }}
          >
            <strong>{p.name}</strong> — {p.type}
          </div>
        ))}

      </div>

    </div>
  );
}