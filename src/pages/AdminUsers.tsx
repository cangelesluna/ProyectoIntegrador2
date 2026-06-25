import { useEffect, useState, type FormEvent } from 'react';
import { db, auth } from '../services/firebase';
import { collection, getDocs, doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import type { User as UserType, UserRole } from '../types';
import { useAuth } from '../hooks/useAuth';

export function AdminUsers() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [role, setRole] = useState<UserRole>('OWNER');
  const { createUser } = useAuth();

  useEffect(() => {
    async function load() {
      setLoading(true);
      const snaps = await getDocs(collection(db, 'users'));
      const data: UserType[] = snaps.docs.map((d) => {
        const raw = d.data() as any;
        return {
          id: d.id,
          name: raw.name ?? '',
          email: raw.email ?? '',
          role: raw.role === 'ADMIN' ? 'ADMIN' : 'OWNER',
          createdAt: raw.createdAt ?? '',
        };
      });
      setUsers(data);
      setLoading(false);
    }
    load();
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password || !adminPassword) {
      alert('Completa correo, contraseña y tu contraseña de administrador.');
      return;
    }

    try {
      const newUser = await createUser(email, password, role, name, adminPassword);
      setUsers((s) => [newUser, ...s]);
      setName('');
      setEmail('');
      setPassword('');
      setAdminPassword('');
      setRole('OWNER');
      alert('Usuario creado correctamente.');
    } catch (err: any) {
      alert('Error creando usuario: ' + (err.message ?? err));
    }
  };

  const handleUpdateRole = async (u: UserType, newRole: UserRole) => {
    await updateDoc(doc(db, 'users', u.id), { role: newRole });
    setUsers((s) => s.map((x) => (x.id === u.id ? { ...x, role: newRole } : x)));
  };

  const handleDelete = async (u: UserType) => {
    if (!confirm('Eliminar usuario de la colección? Esto NO elimina la cuenta de Auth.')) return;
    await deleteDoc(doc(db, 'users', u.id));
    setUsers((s) => s.filter((x) => x.id !== u.id));
  };

  const handleSendReset = async (emailToSend: string) => {
    try {
      await sendPasswordResetEmail(auth, emailToSend);
      alert('Correo de restablecimiento enviado si la cuenta existe.');
    } catch (err: any) {
      alert('Error enviando correo de restablecimiento: ' + (err.message ?? err));
    }
  };

  if (loading) return <div>Cargando usuarios...</div>;

  return (
    <div className="space-y-6 rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-semibold">Gestión de usuarios</h2>

      <form onSubmit={handleCreate} className="grid gap-3 md:grid-cols-3">
        <input placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} className="rounded border p-2" />
        <input placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded border p-2" />
        <input
          placeholder="Contraseña"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded border p-2"
        />
        <input
          placeholder="Contraseña admin"
          type="password"
          value={adminPassword}
          onChange={(e) => setAdminPassword(e.target.value)}
          className="rounded border p-2 md:col-span-2"
        />
        <div className="flex items-center gap-2">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="rounded border p-2"
          >
            <option value="OWNER">OWNER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
          <button type="submit" className="rounded bg-brand-600 px-4 py-2 text-white">
            Crear cuenta
          </button>
        </div>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="text-left text-sm text-slate-600">
              <th className="p-2">Nombre</th>
              <th className="p-2">Correo</th>
              <th className="p-2">Rol</th>
              <th className="p-2">Creado</th>
              <th className="p-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="p-2">{u.name}</td>
                <td className="p-2">{u.email}</td>
                <td className="p-2">
                  <select
                    value={u.role}
                    onChange={(e) => handleUpdateRole(u, e.target.value as UserRole)}
                    className="rounded border p-1"
                  >
                    <option value="OWNER">OWNER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </td>
                <td className="p-2">{(u as any).createdAt}</td>
                <td className="p-2">
                  <div className="flex gap-2">
                    <button onClick={() => handleSendReset(u.email)} className="rounded bg-slate-100 px-3 py-1 text-sm">
                      Reset
                    </button>
                    <button onClick={() => handleDelete(u)} className="rounded bg-rose-100 px-3 py-1 text-sm">
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-sm text-slate-500">
        Nota: La creación desde este panel crea la cuenta de Authentication y el documento en Firestore. Debes ingresar tu contraseña de administrador para restaurar tu sesión tras crear la nueva cuenta. La asignación automática de custom claims para nuevos administradores no se realiza desde el cliente.
      </div>
    </div>
  );
}
