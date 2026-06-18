import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder'
)

export const signIn = (email, password) =>
  supabase.auth.signInWithPassword({ email, password })

export const signOut = () => supabase.auth.signOut()

export const getClients = async () => {
  const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export const getClient = async (id) => {
  const { data, error } = await supabase.from('clients').select('*, client_modules(*), tasks(*), reports(*)').eq('id', id).single()
  if (error) throw error
  return data
}

export const createClient_ = async (client) => {
  const { data, error } = await supabase.from('clients').insert([client]).select().single()
  if (error) throw error
  return data
}

export const updateClient = async (id, updates) => {
  const { data, error } = await supabase.from('clients').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export const deleteClient = async (id) => {
  const { error } = await supabase.from('clients').delete().eq('id', id)
  if (error) throw error
}

export const getClientModules = async (clientId) => {
  const { data, error } = await supabase.from('client_modules').select('*').eq('client_id', clientId).order('created_at')
  if (error) throw error
  return data || []
}

export const addClientModule = async (mod) => {
  const { data, error } = await supabase.from('client_modules').insert([mod]).select().single()
  if (error) throw error
  return data
}

export const updateClientModule = async (id, updates) => {
  const { data, error } = await supabase.from('client_modules').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export const deleteClientModule = async (id) => {
  const { error } = await supabase.from('client_modules').delete().eq('id', id)
  if (error) throw error
}

export const getAllTasks = async () => {
  const { data, error } = await supabase.from('tasks').select('*, clients(name)').order('due_date')
  if (error) throw error
  return data || []
}

export const getClientTasks = async (clientId) => {
  const { data, error } = await supabase.from('tasks').select('*, clients(name)').eq('client_id', clientId).order('due_date')
  if (error) throw error
  return data || []
}

export const createTask = async (task) => {
  const { data, error } = await supabase.from('tasks').insert([task]).select('*, clients(name)').single()
  if (error) throw error
  return data
}

export const updateTask = async (id, updates) => {
  const { data, error } = await supabase.from('tasks').update(updates).eq('id', id).select('*, clients(name)').single()
  if (error) throw error
  return data
}

export const deleteTask = async (id) => {
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw error
}

export const getReports = async (clientId) => {
  let q = supabase.from('reports').select('*, clients(name)').order('report_date', { ascending: false })
  if (clientId) q = q.eq('client_id', clientId)
  const { data, error } = await q
  if (error) throw error
  return data || []
}

export const createReport = async (report) => {
  const { data, error } = await supabase.from('reports').insert([report]).select('*, clients(name)').single()
  if (error) throw error
  return data
}

export const updateReport = async (id, updates) => {
  const { data, error } = await supabase.from('reports').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export const deleteReport = async (id) => {
  const { error } = await supabase.from('reports').delete().eq('id', id)
  if (error) throw error
}

export const getModulesLibrary = async () => {
  const { data, error } = await supabase.from('modules_library').select('*').order('priority')
  if (error) throw error
  return data || []
}

export const getSops = async () => {
  const { data, error } = await supabase.from('sops').select('*').order('category')
  if (error) throw error
  return data || []
}

export const createSop = async (sop) => {
  const { data, error } = await supabase.from('sops').insert([sop]).select().single()
  if (error) throw error
  return data
}

export const updateSop = async (id, updates) => {
  const { data, error } = await supabase.from('sops').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export const getOutsource = async () => {
  const { data, error } = await supabase.from('outsource_network').select('*').order('role')
  if (error) throw error
  return data || []
}

export const createOutsource = async (person) => {
  const { data, error } = await supabase.from('outsource_network').insert([person]).select().single()
  if (error) throw error
  return data
}

export const updateOutsource = async (id, updates) => {
  const { data, error } = await supabase.from('outsource_network').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export const getUserProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await supabase.from('user_profiles').select('*').eq('id', user.id).single()
  if (error) return null
  return data
}

export const getUsers = async () => {
  const { data, error } = await supabase.from('user_profiles').select('*').order('name')
  if (error) throw error
  return data || []
}

export const updateUserRole = async (id, role) => {
  const { data, error } = await supabase.from('user_profiles').update({ role }).eq('id', id).select().single()
  if (error) throw error
  return data
}

export const getContentItems = async (clientId) => {
  let q = supabase.from('content_items').select('*, clients(name)').order('created_at', { ascending: false })
  if (clientId) q = q.eq('client_id', clientId)
  const { data, error } = await q
  if (error) throw error
  return data || []
}

export const createContentItem = async (item) => {
  const { data, error } = await supabase.from('content_items').insert([item]).select('*, clients(name)').single()
  if (error) throw error
  return data
}

export const updateContentItem = async (id, updates) => {
  const { data, error } = await supabase.from('content_items').update(updates).eq('id', id).select('*, clients(name)').single()
  if (error) throw error
  return data
}

export const deleteContentItem = async (id) => {
  const { error } = await supabase.from('content_items').delete().eq('id', id)
  if (error) throw error
}

export const SALES_STAGES = ['New','Reached out','To Action','Discovery','Negotiation','Won','Lost','No Deal stage']
export const PIPELINE_STAGES = [
  ...SALES_STAGES,
  'Onboarding','Stage 1 — Clarity','Stage 2 — Structure',
  'Stage 3 — Growth Partner','Dial an Inara','Alumni'
]
export const HEALTH_OPTIONS = ['🟢 Strong','🟡 Building','🔴 Needs attention']
export const LEAK_STAGES = ['A — Before awareness','B — After enquiry','C — Consideration','D — Decision','E — Post-purchase']
export const PACKAGES = ['Stage 1 — Clarity','Stage 2 — Structure','Stage 3 — Growth Partner','Dial an Inara']
export const TASK_STATUSES = ['To Do','In Progress','Awaiting Approval','Blocked','Complete']
export const TASK_OWNERS = ['Maxine','Team','Videographer','Photographer','Graphic Designer','Copywriter','Web Developer','Automation Specialist','Client']
export const CONTENT_STATUSES = ['Ideas','Strategy Approved','Writing / Drafting','Design / Editing','Internal Review','Ready for Client Review','Sent to Client','Client Feedback Received','Approved','Scheduled','Posted / Sent / Live','Reported']
export const CONTENT_PLATFORMS = ['Instagram','Facebook','LinkedIn','TikTok','YouTube','Email','Website','Blog','Other']
export const CONTENT_TYPES = ['Reel','Carousel','Static Post','Story','Video','Email','Blog Post','Website Copy','Ad','Other']
export const CONTENT_PILLARS = ['Education','Inspiration','Promotion','Connection','Authority','Entertainment','Conversion']
export const SOP_CATEGORIES = ['Content','Systems','Client Management','Sales','Reporting','Training','Outsource']
export const OUTSOURCE_ROLES = ['Videographer','Photographer','Graphic Designer','Copywriter','Web Developer','Automation Specialist','Paid Ads Specialist','Events Planner','PR Company','Sales / SDR','CRM Specialist','Data Analyst','SEO Specialist','MC / Facilitator']
export const ALL_MODULES = ['Brand Positioning & Messaging','Customer Journey Mapping','Content Strategy & Direction','Social Media Systems','Short-Form Video','Website Optimisation','Email Marketing','Lead Generation & Funnels','Photography & Visual Identity','CRM & Automation','Reporting & Analytics','Campaign Planning & Execution','Paid Ads','Event Marketing','SEO & Discoverability','Community & Engagement','Sales Enablement Content','Team Training & Enablement','PR & Earned Media','Partnership & Referral Systems','Long-Form Content','On-Camera Coaching & Presence']
export const MUST_MODULES = ALL_MODULES.slice(0, 12)
