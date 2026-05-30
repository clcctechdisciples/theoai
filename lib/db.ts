import { supabaseAdmin } from './supabase'

// User Management
export async function getUsers() {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
  
  if (error) {
    console.error('Supabase error in getUsers:', error)
    return []
  }
  return data || []
}

export async function addUser(user: any) {
  const payload: any = {
    username: user.username,
    password: user.password,
    securityQuestion: user.securityQuestion || user.recoveryQuestion,
    securityAnswer: user.securityAnswer || user.recoveryAnswer,
  }
  if (user.id) payload.id = user.id

  const { data, error } = await supabaseAdmin
    .from('users')
    .insert(payload)
    .select()
    .single()

  if (error) {
    console.error('Supabase error in addUser:', error)
    throw error
  }
  return data
}

export async function upsertUser(user: any) {
  const payload: any = {
    username: user.username,
    password: user.password,
    securityQuestion: user.securityQuestion || user.recoveryQuestion,
    securityAnswer: user.securityAnswer || user.recoveryAnswer,
    updatedAt: new Date().toISOString()
  }
  if (user.id) payload.id = user.id

  const { data, error } = await supabaseAdmin
    .from('users')
    .upsert(payload, { onConflict: 'username' })
    .select()
    .single()

  if (error) {
    console.error('Supabase error in upsertUser:', error)
    throw error
  }
  return data
}

// Data Management
export async function getData(userId: string) {
  const { data: songs, error: songsError } = await supabaseAdmin
    .from('songs')
    .select('*')
    .eq('userId', userId)
    .order('updatedAt', { ascending: false })

  const { data: backgrounds, error: bgError } = await supabaseAdmin
    .from('backgrounds')
    .select('*')
    .eq('userId', userId)
  
  if (songsError) console.error('Supabase error in getSongs:', songsError)
  if (bgError) console.error('Supabase error in getBackgrounds:', bgError)

  // Format for frontend
  return { 
    songs: (songs || []).map(s => ({ ...s, lyrics: [s.lyrics] })), // Frontend expects array of strings
    backgrounds: backgrounds || [], 
    audio: [] 
  }
}

export async function saveData(userId: string, key: 'songs' | 'backgrounds' | 'audio' | 'slides', value: any) {
  if (key === 'songs') {
    // Check if song with same title exists for this user
    const { data: existing } = await supabaseAdmin
      .from('songs')
      .select('*')
      .eq('userId', userId)
      .eq('title', value.title)
      .single()

    const lyricsStr = Array.isArray(value.lyrics) ? value.lyrics.join('\n') : value.lyrics

    if (existing) {
      const { data, error } = await supabaseAdmin
        .from('songs')
        .update({ lyrics: lyricsStr, updatedAt: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single()
      if (error) throw error
      return data
    } else {
      const { data, error } = await supabaseAdmin
        .from('songs')
        .insert({
          title: value.title,
          lyrics: lyricsStr,
          userId: userId,
        })
        .select()
        .single()
      if (error) throw error
      return data
    }
  } else if (key === 'backgrounds') {
    if (Array.isArray(value)) {
      // Sync backgrounds: delete those not in the list, update/create others
      await supabaseAdmin.from('backgrounds').delete().eq('userId', userId)
      
      const toInsert = value.map(bg => ({
        url: bg.url,
        userId: userId
      }))

      const { data, error } = await supabaseAdmin
        .from('backgrounds')
        .insert(toInsert)
        .select()
      
      if (error) throw error
      return data
    }
  } else if (key === 'slides') {
    // If value.url is a data URI, upload to Supabase Storage instead
    let finalUrl = value.url
    if (value.url.startsWith('data:')) {
      try {
        const [header, base64Data] = value.url.split(',')
        const mime = header.split(':')[1].split(';')[0]
        const ext = mime.split('/')[1] || 'png'
        const buffer = Buffer.from(base64Data, 'base64')
        const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`

        const { data: uploadData, error: uploadError } = await supabaseAdmin
          .storage
          .from('slides')
          .upload(fileName, buffer, {
            contentType: mime,
            upsert: true
          })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabaseAdmin
          .storage
          .from('slides')
          .getPublicUrl(fileName)
        
        finalUrl = publicUrl
      } catch (e) {
        console.error('Error uploading slide to storage:', e)
        // Fallback to data URI if storage fails
      }
    }

    const { data, error } = await supabaseAdmin
      .from('slides')
      .insert({
        title: value.title,
        url: finalUrl,
        userId: userId
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

export async function resetPassword(username: string, newHashedPassword: string) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .update({ password: newHashedPassword, updatedAt: new Date().toISOString() })
    .eq('username', username)
    .select()
    .single()

  if (error) {
    console.error('Supabase error in resetPassword:', error)
    return false
  }
  return true
}

// Settings Management
export async function getSettings(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('settings')
    .select('*')
    .eq('userId', userId)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found"
    console.error('Supabase error in getSettings:', error)
  }
  return data
}

export async function updateSettings(userId: string, settings: any) {
  const { data: existing } = await supabaseAdmin
    .from('settings')
    .select('*')
    .eq('userId', userId)
    .single()

  if (existing) {
    const { data, error } = await supabaseAdmin
      .from('settings')
      .update(settings)
      .eq('userId', userId)
      .select()
      .single()
    if (error) throw error
    return data
  } else {
    const { data, error } = await supabaseAdmin
      .from('settings')
      .insert({ ...settings, userId })
      .select()
      .single()
    if (error) throw error
    return data
  }
}

// Recording Management
export async function getRecordingByFilename(userId: string, filename: string) {
  const { data, error } = await supabaseAdmin
    .from('recordings')
    .select('*')
    .eq('userId', userId)
    .eq('filename', filename)
    .single()
  
  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function addRecording(recording: { title: string, filename: string, type: string, userId: string, data?: Buffer }) {
  const payload: any = {
    title: recording.title,
    filename: recording.filename,
    type: recording.type,
    userId: recording.userId,
    data: recording.data ? recording.data.toString('base64') : null
  }

  const { data, error } = await supabaseAdmin
    .from('recordings')
    .insert(payload)
    .select()
    .single()

  if (error) {
    console.error('Supabase error in addRecording:', error)
    throw error
  }
  return data
}

export async function updateRecording(id: string, recording: any) {
  const payload: any = { ...recording, updatedAt: new Date().toISOString() }
  if (recording.data && Buffer.isBuffer(recording.data)) {
    payload.data = recording.data.toString('base64')
  }

  const { data, error } = await supabaseAdmin
    .from('recordings')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Supabase error in updateRecording:', error)
    throw error
  }
  return data
}

export async function getRecordings(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('recordings')
    .select('*')
    .eq('userId', userId)
    .order('createdAt', { ascending: false })

  if (error) {
    console.error('Supabase error in getRecordings:', error)
    return []
  }
  return data || []
}

export async function deleteRecording(id: string, userId: string) {
  const { error } = await supabaseAdmin
    .from('recordings')
    .delete()
    .eq('id', id)
    .eq('userId', userId)

  if (error) {
    console.error('Supabase error in deleteRecording:', error)
    throw error
  }
  return true
}

export async function deleteRecordingByFilename(userId: string, filename: string) {
  const { error } = await supabaseAdmin
    .from('recordings')
    .delete()
    .eq('userId', userId)
    .eq('filename', filename)

  if (error) {
    console.error('Supabase error in deleteRecordingByFilename:', error)
    throw error
  }
  return true
}
