"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function Appointments(){

  const [appointments,setAppointments] = useState<any[]>([]);
  const [patients,setPatients] = useState<any[]>([]);
  const [showAdd,setShowAdd] = useState(false);

  const [form,setForm] = useState({
    patient_id:"",
    patient_name:"",
    date:"",
    time:""
  });

  useEffect(()=>{
    loadAppointments();
    loadPatients();
  },[]);

  async function loadAppointments(){
    const { data } = await supabase
      .from("appointments")
      .select("*")
      .order("time",{ascending:true});

    if(data) setAppointments(data);
  }

  async function loadPatients(){
    const { data } = await supabase
      .from("patients")
      .select("*");

    if(data) setPatients(data);
  }

  async function addAppointment(){

    if(!form.patient_id) return;

    await supabase.from("appointments").insert({
      patient_id:form.patient_id,
      patient_name:form.patient_name,
      date:form.date,
      time:form.time,
      status:"confirmed"
    });

    setShowAdd(false);
    setForm({patient_id:"",patient_name:"",date:"",time:""});
    loadAppointments();
  }

  return(
    <div>

      {/* HEADER */}
      <div className="topbar" style={{display:"flex",justifyContent:"space-between"}}>
        <div>
          <div className="page-title">Appointment Schedule</div>
          <div className="page-subtitle">Daily clinic timeline</div>
        </div>

        <button className="btn-primary" onClick={()=>setShowAdd(true)}>
          ＋ New Appointment
        </button>
      </div>

      {/* TIMELINE */}
      <div className="card" style={{marginTop:"20px"}}>
        <div className="card-header">
          <span className="card-title">Today's Timeline</span>
        </div>

        <div style={{padding:"20px"}}>

          {appointments.length === 0 &&(
            <p>No appointments yet.</p>
          )}

          {appointments.map((a:any)=>(
            <div
              key={a.id}
              style={{
                display:"flex",
                gap:"20px",
                alignItems:"center",
                padding:"12px 0",
                borderBottom:"1px solid #eee"
              }}
            >
              <div style={{width:"80px",fontWeight:600}}>
                {a.time}
              </div>

              <div style={{flex:1}}>
                <Link href={`/patients/${a.patient_id}`}>
                  <b>{a.patient_name}</b>
                </Link>
                <div style={{fontSize:"13px",opacity:0.7}}>
                  {a.date}
                </div>
              </div>

              <span
                style={{
                  padding:"4px 12px",
                  borderRadius:"20px",
                  fontSize:"12px",
                  background:
                    a.status==="confirmed"
                      ? "#e8f7ee"
                      : a.status==="pending"
                      ? "#fff4e5"
                      : "#ffe8ec"
                }}
              >
                {a.status}
              </span>
            </div>
          ))}

        </div>
      </div>

      {/* ADD APPOINTMENT PANEL */}
      {showAdd &&(
        <div className="slide-panel">
          <div className="panel-content">

            <h3>Create Appointment</h3>

            <select
              value={form.patient_id}
              onChange={(e)=>{
                const selected = patients.find(p=>p.id===e.target.value);
                setForm({
                  ...form,
                  patient_id:e.target.value,
                  patient_name:selected?.name || ""
                });
              }}
            >
              <option>Select Patient</option>
              {patients.map((p:any)=>(
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <input
              placeholder="Date"
              value={form.date}
              onChange={e=>setForm({...form,date:e.target.value})}
            />

            <input
              placeholder="Time"
              value={form.time}
              onChange={e=>setForm({...form,time:e.target.value})}
            />

            <button onClick={addAppointment}>Save</button>
            <button onClick={()=>setShowAdd(false)}>Cancel</button>

          </div>
        </div>
      )}

    </div>
  );
}