'use client';

import { useState } from 'react';
import { updateUser } from '@/app/actions/user';

interface User {
  id: string;
  name: string;
  age: number;
  yearGroup: number;
  hobbies?: string | null;
  pets?: string | null;
}

export default function EditProfileForm({ user }: { user: User }) {
  const [name, setName] = useState(user.name);
  const [age, setAge] = useState(user.age);
  const [yearGroup, setYearGroup] = useState(user.yearGroup);
  
  const [hobbies, setHobbies] = useState<string[]>(() => {
    try {
      return user.hobbies ? JSON.parse(user.hobbies) : [];
    } catch {
      return [];
    }
  });
  const [currentHobby, setCurrentHobby] = useState('');

  const [pets, setPets] = useState<{ name: string; type: string }[]>(() => {
    try {
      return user.pets ? JSON.parse(user.pets) : [];
    } catch {
      return [];
    }
  });
  const [currentPetName, setCurrentPetName] = useState('');
  const [currentPetType, setCurrentPetType] = useState('Dog');

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const addHobby = () => {
    const trimmed = currentHobby.trim();
    if (trimmed && !hobbies.includes(trimmed)) {
      setHobbies([...hobbies, trimmed]);
      setCurrentHobby('');
    }
  };

  const removeHobby = (hobbyToRemove: string) => {
    setHobbies(hobbies.filter((h) => h !== hobbyToRemove));
  };

  const addPet = () => {
    const trimmedName = currentPetName.trim();
    if (trimmedName && currentPetType) {
      setPets([...pets, { name: trimmedName, type: currentPetType }]);
      setCurrentPetName('');
    }
  };

  const removePet = (indexToRemove: number) => {
    setPets(pets.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setMessage({ text: 'Please enter a name! 😊', type: 'error' });
      return;
    }

    setIsSaving(true);
    setMessage(null);
    try {
      await updateUser({
        name: name.trim(),
        age,
        yearGroup,
        hobbies,
        pets
      });
      setMessage({ text: 'Profile updated successfully! 🎉', type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Failed to update profile:', error);
      setMessage({ text: 'Oops! Something went wrong. Please try again.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="bg-white/95 text-slate-900 p-6 rounded-2xl border-2 border-teal-100 shadow-sm space-y-5">
      <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
        ⚙️ Edit Child Profile
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Details */}
        <div className="space-y-1">
          <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide block">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-teal-400 outline-none text-slate-900 bg-white font-medium"
            placeholder="Name..."
            disabled={isSaving}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide block">Age</label>
            <select
              value={age}
              onChange={(e) => {
                const a = parseInt(e.target.value, 10);
                setAge(a);
                setYearGroup(Math.max(1, Math.min(6, a - 4)));
              }}
              className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-teal-400 outline-none text-slate-900 bg-white font-medium cursor-pointer"
              disabled={isSaving}
            >
              {[5, 6, 7, 8, 9, 10, 11, 12].map((a) => (
                <option key={a} value={a}>
                  {a} years old
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide block">School Year</label>
            <select
              value={yearGroup}
              onChange={(e) => setYearGroup(parseInt(e.target.value, 10))}
              className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-teal-400 outline-none text-slate-900 bg-white font-medium cursor-pointer"
              disabled={isSaving}
            >
              {[1, 2, 3, 4, 5, 6].map((y) => (
                <option key={y} value={y}>
                  Year {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Personalization Hobbies */}
        <div className="space-y-2 border-t pt-4 border-slate-100">
          <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide block">Personalization Hobbies</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={currentHobby}
              onChange={(e) => setCurrentHobby(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addHobby())}
              className="flex-1 p-2.5 border-2 border-slate-200 rounded-xl focus:border-purple-400 outline-none text-slate-900 bg-white text-sm font-medium"
              placeholder="e.g. Football, Coding..."
              disabled={isSaving}
            />
            <button
              type="button"
              onClick={addHobby}
              className="bg-purple-100 hover:bg-purple-200 text-purple-700 font-bold px-4 rounded-xl text-sm transition-colors cursor-pointer"
              disabled={isSaving}
            >
              Add Hobby
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {hobbies.length === 0 && <span className="text-xs text-slate-400 italic">No hobbies added yet.</span>}
            {hobbies.map((h) => (
              <span
                key={h}
                className="bg-purple-50 text-purple-800 text-xs font-extrabold pl-2.5 pr-1 py-1 rounded-full border border-purple-100 flex items-center gap-1 shadow-sm"
              >
                {h}
                <button
                  type="button"
                  onClick={() => removeHobby(h)}
                  className="hover:bg-purple-200 text-purple-600 hover:text-purple-800 rounded-full w-4 h-4 flex items-center justify-center font-bold text-[9px] cursor-pointer"
                  disabled={isSaving}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Personalization Pets */}
        <div className="space-y-2 border-t pt-4 border-slate-100">
          <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide block">Personalization Pets</label>
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={currentPetName}
              onChange={(e) => setCurrentPetName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPet())}
              className="w-full p-2.5 border-2 border-slate-200 rounded-xl focus:border-green-400 outline-none text-slate-900 bg-white text-sm font-medium"
              placeholder="Pet's name (e.g. Fluffy)"
              disabled={isSaving}
            />
            <div className="flex gap-2">
              <select
                value={currentPetType}
                onChange={(e) => setCurrentPetType(e.target.value)}
                className="flex-1 p-2.5 border-2 border-slate-200 rounded-xl focus:border-green-400 outline-none text-slate-900 bg-white text-sm font-medium cursor-pointer"
                disabled={isSaving}
              >
                {['Dog', 'Cat', 'Hamster', 'Rabbit', 'Fish', 'Dragon', 'Horse', 'Chicken'].map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={addPet}
                className="bg-green-100 hover:bg-green-200 text-green-700 font-bold px-6 rounded-xl text-sm transition-colors cursor-pointer"
                disabled={isSaving}
              >
                Add Pet
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {pets.length === 0 && <span className="text-xs text-slate-400 italic">No pets added yet.</span>}
            {pets.map((p, idx) => (
              <span
                key={idx}
                className="bg-green-50 text-green-800 text-xs font-extrabold pl-2.5 pr-1 py-1 rounded-full border border-green-100 flex items-center gap-1 shadow-sm"
              >
                {p.name} ({p.type})
                <button
                  type="button"
                  onClick={() => removePet(idx)}
                  className="hover:bg-green-200 text-green-600 hover:text-green-800 rounded-full w-4 h-4 flex items-center justify-center font-bold text-[9px] cursor-pointer"
                  disabled={isSaving}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>

        {message && (
          <div
            className={`p-3 rounded-xl text-center font-bold text-sm border animate-in fade-in slide-in-from-top-2 ${
              message.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={isSaving}
          className="w-full bg-teal-500 hover:bg-teal-600 active:scale-[0.98] text-white font-bold py-3.5 rounded-xl transition-all cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
        >
          {isSaving ? (
            <>
              <span className="animate-spin text-lg">⏳</span> Saving Changes...
            </>
          ) : (
            'Save Profile Changes'
          )}
        </button>
      </form>
    </section>
  );
}
