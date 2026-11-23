"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/client";
import { Button } from "@/components/ui/button";
import type { User } from "@supabase/supabase-js";

type RecordItem = {
  username: string;
  demo_value: string | null;
  updated_at: string | null;
};

export default function HomePage() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // Auth form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Records states
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [username, setUsername] = useState("");
  const [demoValue, setDemoValue] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // Check active session on load
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setAuthChecking(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  const fetchRecords = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("records")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching records:", error.message);
    } else if (data) {
      setRecords(data);
    }
  }, [supabase, user]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Auth Handlers
  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert("Sign in error: " + error.message);
    setAuthLoading(false);
  }

  async function handleSignUp() {
    setAuthLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      alert("Sign up error: " + error.message);
    } else {
      alert("Account created! You can now sign in.");
    }
    setAuthLoading(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setRecords([]);
  }

  // Record CRUD Handlers
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    const { error } = await supabase.from("records").upsert({
      username: username.trim(),
      demo_value: demoValue.trim(),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      alert("Error saving: " + error.message);
    } else {
      setUsername("");
      setDemoValue("");
      fetchRecords();
    }
    setLoading(false);
  }

  function handleEdit(item: RecordItem) {
    setUsername(item.username);
    setDemoValue(item.demo_value ?? "");
  }

  async function handleDelete(targetUsername: string) {
    const { error } = await supabase
      .from("records")
      .delete()
      .eq("username", targetUsername);

    if (error) {
      alert("Error deleting: " + error.message);
    } else {
      fetchRecords();
    }
  }

  if (authChecking) {
    return <main className="max-w-md mx-auto p-8">Checking session...</main>;
  }

  // Show Login / Sign Up screen if not logged in
  if (!user) {
    return (
      <main className="max-w-md mx-auto p-8 space-y-6">
        <h1 className="text-2xl font-bold">Sriteja Record-Keeper Login</h1>
        <form onSubmit={handleSignIn} className="space-y-4 border p-6 rounded-lg">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded px-3 py-2 text-black bg-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded px-3 py-2 text-black bg-white"
              required
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={authLoading}>
              {authLoading ? "Please wait..." : "Sign In"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={authLoading}
              onClick={handleSignUp}
            >
              Sign Up
            </Button>
          </div>
        </form>
      </main>
    );
  }

  const filteredRecords = records.filter(
    (item) =>
      item.username.toLowerCase().includes(search.toLowerCase()) ||
      (item.demo_value ?? "").toLowerCase().includes(search.toLowerCase())
  );

  // Show Records Dashboard when logged in
  return (
    <main className="max-w-xl mx-auto p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Sriteja Record-Keeper</h1>
          <p className="text-xs text-gray-500">Signed in as {user.email}</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleSignOut}>
          Sign Out
        </Button>
      </div>

      <form onSubmit={handleSave} className="space-y-4 border p-4 rounded-lg">
        <div>
          <label className="block text-sm font-medium mb-1">Username</label>
          <input
            type="text"
            placeholder="e.g. Harsha_Info_Class"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border rounded px-3 py-2 text-black bg-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Demo Value</label>
          <input
            type="text"
            placeholder="Enter value..."
            value={demoValue}
            onChange={(e) => setDemoValue(e.target.value)}
            className="w-full border rounded px-3 py-2 text-black bg-white"
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save Record"}
          </Button>
          {username && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setUsername("");
                setDemoValue("");
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </form>

      <div className="space-y-3">
        <div className="flex justify-between items-center gap-4">
          <h2 className="text-lg font-semibold">
            Saved Records ({filteredRecords.length})
          </h2>
          <input
            type="text"
            placeholder="Search records..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded px-3 py-1.5 text-sm text-black bg-white"
          />
        </div>

        {filteredRecords.length === 0 ? (
          <p className="text-sm text-gray-500">No matching records found.</p>
        ) : (
          filteredRecords.map((item) => (
            <div
              key={item.username}
              className="border p-3 rounded flex justify-between items-center gap-4"
            >
              <div>
                <p className="font-medium">{item.username}</p>
                <p className="text-sm text-gray-500">{item.demo_value}</p>
                <span className="text-xs text-gray-400">
                  {item.updated_at ? new Date(item.updated_at).toLocaleString() : ""}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(item)}
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(item.username)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
