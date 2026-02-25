"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function PatientsPage() {

  const [patients,setPatients] = useState<any[]>([]);

  useEffect(()=>{
    loadPatients();
  },[]);

  async function loadPatients(){
    const { data } = await supabase
      .from("patients")
      .select("*")
      .order("created_at",{ascending:false});

    if(data) setPatients(data);
  }

  return(
    <div style={{padding:30}}>

      <h1>Patients</h1>

      <div className="card" style={{marginTop:20}}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Age</th>
              <th>Type</th>
            </tr>
          </thead>

          <tbody>
            {patients.map(p=>(
              <tr key={p.id}>
                <td>
                  <Link href={`/patients/${p.id}`}>
                    {p.name}
                  </Link>
                </td>
                <td>{p.age}</td>
                <td>{p.type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}