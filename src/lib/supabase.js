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

export const getClientComments = async (clientId) => {
  const { data, error } = await supabase.from('client_comments').select('*').eq('client_id', clientId).order('created_at')
  if (error) throw error
  return data || []
}

export const createClientComment = async (comment) => {
  const { data, error } = await supabase.from('client_comments').insert([comment]).select().single()
  if (error) throw error
  return data
}

export const getClientEmails = async (clientId) => {
  const { data, error } = await supabase.from('client_emails').select('*').eq('client_id', clientId).order('sent_at', { ascending: false })
  if (error) throw error
  return data || []
}

export const createClientEmail = async (email) => {
  const { data, error } = await supabase.from('client_emails').insert([email]).select().single()
  if (error) throw error
  return data
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

export const ACTION_TAKEN_OPTIONS = ['Emailed','Called',"DM'd",'Met in person','Sent proposal','Sent invoice','Sent contract','Left voicemail','Sent follow-up','Made intro']
export const NEXT_ACTION_OPTIONS = ['Send email','Make call','Send proposal','Follow up','Schedule meeting','Book discovery call','Send contract','Send invoice','Await response','No action needed']
export const CONNECTION_STRENGTHS = ['Cold','Warm','Hot','Existing relationship','Referral','Past client','Event connection']
export const OPPORTUNITY_TAGS = [
  'Great for content shoots','Lunch / relationship building','Strong referral opportunity',
  'Full marketing package potential','Needs brand clarity','Needs social media structure',
  'Good for email marketing','Website improvement needed','High-end audience fit',
  'Strong partnership potential','Event / campaign opportunity','Warm connection','Needs nurturing'
]
export const RELATIONSHIP_ACTIONS = [
  'Call them','Invite for coffee','Take to lunch','Send warm email',
  'Send proposal','Send strategy offer','Invite to event','Follow up after event',
  'Introduce to someone','Send content idea','Send audit feedback'
]
export const DIAG_AREAS = [
  { key:'diag_brand_clarity', label:'Brand clarity' },
  { key:'diag_messaging', label:'Messaging' },
  { key:'diag_social_presence', label:'Social media presence' },
  { key:'diag_content_consistency', label:'Content consistency' },
  { key:'diag_website_journey', label:'Website journey' },
  { key:'diag_email_marketing', label:'Email marketing' },
  { key:'diag_lead_generation', label:'Lead generation' },
  { key:'diag_sales_process', label:'Sales process' },
  { key:'diag_customer_experience', label:'Customer experience' },
  { key:'diag_retention', label:'Retention / repeat business' },
  { key:'diag_campaign_opps', label:'Campaign opportunities' },
  { key:'diag_partnership_opps', label:'Partnership opportunities' },
]
export const STAGE_TASK_FLOWS = {
  'Discovery Call': ['Research business background','Review social media & website','Prepare discovery questions','Run discovery call','Take detailed notes','Send follow-up email'],
  'Relationship Building': ['Send warm message','Comment on a recent post','Invite to coffee or lunch','Send a helpful idea','Add to nurture list','Set follow-up reminder for 2 weeks'],
  'Make Proposal': ['Review diagnosis audit','Confirm client pain points','Choose recommended offer','Create proposal','Add pricing','Add case studies / examples','Send proposal email','Schedule proposal presentation','Follow up 3 days later'],
  'Proposal Presented': ['Send thank-you email','Add proposal notes','Set follow-up date','Prepare objection responses','Send testimonial / proof if needed','Follow up with decision'],
  'Client Won': ['Send onboarding email','Send invoice','Create client folder','Create Milanote / client board','Request brand assets','Book strategy call','Add client to content calendar','Set first delivery date','Add to active client dashboard'],
  'Onboarding': ['Send onboarding welcome email','Confirm invoice paid','Book strategy kick-off call','Create client folder','Request brand assets','Set up client board','Add to content calendar','Brief the team'],
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

export const MEETING_TYPES = ['Discovery Call','Strategy Session','Check-in / Update','Proposal Meeting','Onboarding Call','Kick-off Meeting','Review Meeting','Planning Session','Ad hoc / General']

export const getClientMeetings = async (clientId) => {
  const { data, error } = await supabase.from('client_meetings').select('*').eq('client_id', clientId).order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export const createClientMeeting = async (meeting) => {
  const { data, error } = await supabase.from('client_meetings').insert([meeting]).select().single()
  if (error) throw error
  return data
}

export const updateClientMeeting = async (id, updates) => {
  const { data, error } = await supabase.from('client_meetings').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export const deleteClientMeeting = async (id) => {
  const { error } = await supabase.from('client_meetings').delete().eq('id', id)
  if (error) throw error
}

export const getClientNotesList = async (clientId) => {
  const { data, error } = await supabase.from('client_notes').select('*').eq('client_id', clientId).order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export const createClientNote = async (note) => {
  const { data, error } = await supabase.from('client_notes').insert([note]).select().single()
  if (error) throw error
  return data
}

export const updateClientNote = async (id, updates) => {
  const { data, error } = await supabase.from('client_notes').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export const deleteClientNote = async (id) => {
  const { error } = await supabase.from('client_notes').delete().eq('id', id)
  if (error) throw error
}
