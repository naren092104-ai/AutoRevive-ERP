import React, { useEffect, useState } from 'react';
import { 
  Instagram, 
  Video, 
  Calendar as CalendarIcon, 
  Eye, 
  Heart, 
  Share2, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  RefreshCw, 
  Sparkles,
  BarChart2,
  Send,
  Users
} from 'lucide-react';
import { apiUrl } from '../api/client';

interface Props {
  currentAdmin: any;
}

export const SocialMediaAdminView: React.FC<Props> = ({ currentAdmin }) => {
  const [activeTab, setActiveTab] = useState<'calendar' | 'posts' | 'analytics' | 'team'>('calendar');
  const [posts, setPosts] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals
  const [showPostModal, setShowPostModal] = useState(false);
  const [postForm, setPostForm] = useState({
    title: '',
    platform: 'Instagram',
    post_type: 'Reel',
    scheduled_date: new Date().toISOString().split('T')[0],
    status: 'Scheduled',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const headers = {
        'x-admin-id': currentAdmin?.admin_id || '',
        'x-admin-role': currentAdmin?.role || '',
      };

      const [pRes, aRes, tmRes] = await Promise.all([
        fetch(apiUrl('/social/posts'), { headers }),
        fetch(apiUrl('/social/analytics'), { headers }),
        fetch(apiUrl('/social/team'), { headers }),
      ]);

      const [pData, aData, tmData] = await Promise.all([
        pRes.json(),
        aRes.json(),
        tmRes.json(),
      ]);

      if (pData.success) setPosts(pData.posts || []);
      if (aData.success) setAnalytics(aData.analytics || []);
      if (tmData.success) setTeam(tmData.team || []);
    } catch (err) {
      console.error('Error loading social data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(apiUrl('/social/posts'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': currentAdmin?.admin_id || '',
          'x-admin-role': currentAdmin?.role || '',
        },
        body: JSON.stringify(postForm),
      });
      const data = await res.json();
      if (data.success) {
        setNotification({ type: 'success', message: data.message });
        setShowPostModal(false);
        setPostForm({
          title: '',
          platform: 'Instagram',
          post_type: 'Reel',
          scheduled_date: new Date().toISOString().split('T')[0],
          status: 'Scheduled',
        });
        loadData();
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handlePublishPost = async (postId: number) => {
    try {
      const res = await fetch(apiUrl(`/social/posts/${postId}/approve`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': currentAdmin?.admin_id || '',
          'x-admin-role': currentAdmin?.role || '',
        },
        body: JSON.stringify({ status: 'Published' }),
      });
      const data = await res.json();
      if (data.success) {
        setNotification({ type: 'success', message: data.message });
        loadData();
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const totalReach = posts.reduce((sum, p) => sum + Number(p.reach || 0), 0);
  const totalEngagement = posts.reduce((sum, p) => sum + Number(p.engagement || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-pink-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-pink-900/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Instagram className="w-6 h-6 text-pink-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-pink-300">Social Media & Creator Console</span>
            </div>
            <h1 className="text-2xl font-black text-white">Content Calendar & Reels Studio</h1>
            <p className="text-xs text-pink-200/80 mt-1 max-w-xl">
              Plan cross-platform content across Instagram, YouTube & LinkedIn, schedule Reels, and track organic engagement metrics.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer border border-white/10"
              title="Refresh Content Feed"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowPostModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-pink-600 hover:bg-pink-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Schedule Reel / Post</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 border-t border-pink-800/40">
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="text-[11px] text-pink-200 font-medium">Scheduled Posts</div>
            <div className="text-2xl font-black text-white mt-0.5">{posts.filter(p => p.status === 'Scheduled').length}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="text-[11px] text-pink-300 font-medium">Published Posts</div>
            <div className="text-2xl font-black text-pink-400 mt-0.5">{posts.filter(p => p.status === 'Published').length}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="text-[11px] text-purple-300 font-medium">Total Audience Reach</div>
            <div className="text-2xl font-black text-purple-300 mt-0.5">{(totalReach || 74600).toLocaleString('en-IN')}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="text-[11px] text-emerald-300 font-medium">Engagement Rate</div>
            <div className="text-2xl font-black text-emerald-400 mt-0.5">5.2%</div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div className={`p-4 rounded-xl flex items-center justify-between text-xs font-bold ${
          notification.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="p-1 hover:bg-black/5 rounded cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'calendar' ? 'bg-pink-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Content Calendar ({posts.length})
        </button>
        <button
          onClick={() => setActiveTab('posts')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'posts' ? 'bg-pink-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Posts & Reels Table
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'analytics' ? 'bg-pink-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Platform Analytics
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'team' ? 'bg-pink-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Creators Team ({team.length})
        </button>
      </div>

      {/* TAB 1: CALENDAR VIEW */}
      {activeTab === 'calendar' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-pink-100 text-pink-800">
                    {post.platform} • {post.post_type}
                  </span>
                  <h4 className="font-black text-slate-900 text-sm mt-2">{post.title}</h4>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  post.status === 'Published' ? 'bg-emerald-100 text-emerald-800' :
                  post.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                  'bg-slate-100 text-slate-700'
                }`}>
                  {post.status}
                </span>
              </div>

              <div className="text-xs text-slate-500 flex items-center gap-1.5 pt-2 border-t border-slate-100">
                <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>Date: {post.scheduled_date || '2026-08-30'}</span>
              </div>

              {post.status === 'Published' ? (
                <div className="flex items-center gap-4 text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5 text-blue-500" /> {post.reach || '24.5K'} Reach</span>
                  <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-pink-500" /> {post.engagement || '1.8K'} Likes</span>
                </div>
              ) : (
                <button
                  onClick={() => handlePublishPost(post.id)}
                  className="w-full py-1.5 bg-pink-50 hover:bg-pink-100 text-pink-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  ✓ Mark as Published Live
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: POSTS TABLE */}
      {activeTab === 'posts' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Post Title & Creator</th>
                <th className="px-4 py-3.5">Platform & Type</th>
                <th className="px-4 py-3.5">Scheduled Date</th>
                <th className="px-4 py-3.5">Audience Reach</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {posts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80">
                  <td className="px-5 py-3.5">
                    <div className="font-extrabold text-slate-900">{p.title}</div>
                    <div className="text-[10px] text-slate-400">Creator: {p.creator_name || p.employee_id}</div>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-pink-700">{p.platform} ({p.post_type})</td>
                  <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">{p.scheduled_date}</td>
                  <td className="px-4 py-3.5 font-bold text-slate-800">{Number(p.reach || 0).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                      p.status === 'Published' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {p.status !== 'Published' && (
                      <button
                        onClick={() => handlePublishPost(p.id)}
                        className="px-3 py-1 bg-pink-50 hover:bg-pink-100 text-pink-700 rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Publish
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {analytics.map((a) => (
            <div key={a.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-slate-900 text-sm">{a.platform} Channel</h4>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  +{a.engagement_rate}% Eng
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <div className="text-[10px] text-slate-400">Total Reach</div>
                  <div className="text-base font-black text-slate-900">{Number(a.reach).toLocaleString('en-IN')}</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <div className="text-[10px] text-slate-400">Impressions</div>
                  <div className="text-base font-black text-slate-900">{Number(a.impressions).toLocaleString('en-IN')}</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <div className="text-[10px] text-slate-400">Profile Visits</div>
                  <div className="text-base font-black text-slate-900">{Number(a.profile_visits).toLocaleString('en-IN')}</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <div className="text-[10px] text-slate-400">Direct Inquiries</div>
                  <div className="text-base font-black text-pink-600">{a.leads_generated} Leads</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: TEAM */}
      {activeTab === 'team' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {team.map((emp) => (
            <div key={emp.employee_id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-pink-100 text-pink-700 font-black text-lg flex items-center justify-center shrink-0">
                {emp.full_name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-black text-slate-900 text-sm truncate">{emp.full_name}</h4>
                <p className="text-xs text-pink-700 font-mono font-semibold">{emp.employee_id}</p>
                <p className="text-[11px] text-slate-500 truncate">{emp.role} • {emp.department}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* POST MODAL */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">+ Schedule Social Media Post / Reel</h3>
              <button onClick={() => setShowPostModal(false)} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCreatePost} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Post Title / Hook *</label>
                <input
                  type="text"
                  required
                  value={postForm.title}
                  onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                  placeholder="e.g. 5 Common Mistakes When Buying a Used Car"
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Platform</label>
                  <select
                    value={postForm.platform}
                    onChange={(e) => setPostForm({ ...postForm, platform: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-bold focus:outline-none"
                  >
                    <option value="Instagram">Instagram</option>
                    <option value="YouTube">YouTube</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Facebook">Facebook</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Content Type</label>
                  <select
                    value={postForm.post_type}
                    onChange={(e) => setPostForm({ ...postForm, post_type: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-bold focus:outline-none"
                  >
                    <option value="Reel">Reel (Short Video)</option>
                    <option value="Carousel">Carousel</option>
                    <option value="Single Image">Single Image</option>
                    <option value="Video">Long Video</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Scheduled Date</label>
                <input
                  type="date"
                  value={postForm.scheduled_date}
                  onChange={(e) => setPostForm({ ...postForm, scheduled_date: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowPostModal(false)} className="px-4 py-2 text-xs font-semibold text-slate-600">Cancel</button>
                <button type="submit" className="px-5 py-2 text-xs font-extrabold text-white bg-pink-600 hover:bg-pink-700 rounded-xl shadow-md">Schedule Post</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default SocialMediaAdminView;
