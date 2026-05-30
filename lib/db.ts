import { supabaseAdmin } from './supabase'

function checkDb() {
  if (!supabaseAdmin) {
    const missing = []
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.SUPABASE_URL) missing.push('SUPABASE_URL')
    if (!process.env.SERVICEROLE_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SERVICE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY')
    
    throw new Error(`Supabase Admin client is not initialized. Missing: ${missing.join(', ')}. Please check your Vercel environment variables.`)
  }
}

// User Management
export async function getUsers() {
  checkDb()
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
  checkDb()
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
  checkDb()
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
  checkDb()
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
    songs: (songs || []).map((s: any) => ({ 
      ...s, 
      lyrics: Array.isArray(s.lyrics) ? s.lyrics : [s.lyrics] // Ensure it's an array for the frontend
    })),
    backgrounds: backgrounds || [], 
    audio: [] 
  }
}

export async function saveData(userId: string, key: 'songs' | 'backgrounds' | 'audio' | 'slides', value: any) {
  checkDb()
  if (key === 'songs') {
    // Check if song with same title exists for this user
    const { data: existing, error: findError } = await supabaseAdmin
      .from('songs')
      .select('*')
      .eq('userId', userId)
      .eq('title', value.title)
      .maybeSingle()

    if (findError) {
      console.error('Error finding song:', findError)
      throw findError
    }

    // Ensure lyrics is stored as a string in the DB
    const lyricsStr = Array.isArray(value.lyrics) ? value.lyrics.join('\n') : (value.lyrics || '')

    if (existing) {
      console.log('Updating existing song:', existing.id)
      const { data, error } = await supabaseAdmin
        .from('songs')
        .update({ lyrics: lyricsStr, updatedAt: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single()
      if (error) {
        console.error('Error updating song:', error)
        throw error
      }
      return data
    } else {
      console.log('Inserting new song for user:', userId)
      const { data, error } = await supabaseAdmin
        .from('songs')
        .insert({
          title: value.title,
          lyrics: lyricsStr,
          userId: userId,
        })
        .select()
        .single()
      if (error) {
        console.error('Error inserting song:', error)
        throw error
      }
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
    console.log('Saving slide for user:', userId)
    // If value.url is a data URI, upload to Supabase Storage instead
    let finalUrl = value.url
    if (value.url && value.url.startsWith('data:')) {
      try {
        console.log('Detected Data URI, ensuring Storage bucket exists: slides')
        
        // Ensure bucket exists
        const { data: buckets } = await supabaseAdmin.storage.listBuckets()
        if (!buckets?.find((b: any) => b.name === 'slides')) {
          console.log('Creating slides bucket...')
          await supabaseAdmin.storage.createBucket('slides', { public: true })
        }

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

        if (uploadError) {
          console.error('Supabase Storage upload error:', uploadError)
          throw uploadError
        }

        const { data: { publicUrl } } = supabaseAdmin
          .storage
          .from('slides')
          .getPublicUrl(fileName)
        
        finalUrl = publicUrl
        console.log('Slide uploaded successfully to Storage:', finalUrl)
      } catch (e) {
        console.error('Error uploading slide to storage:', e)
        // Fallback to data URI if storage fails
      }
    }

    const { data, error } = await supabaseAdmin
      .from('slides')
      .insert({
        title: value.title || 'Untitled Slide',
        url: finalUrl,
        userId: userId
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error inserting slide into DB:', error)
      throw error
    }
    return data
  }
}

export async function resetPassword(username: string, newHashedPassword: string) {
  checkDb()
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
  checkDb()
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
  checkDb()
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
  checkDb()
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
  checkDb()
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
  checkDb()
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
  checkDb()
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
  checkDb()
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
  checkDb()
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

// Media Management
export async function getMedia(userId: string) {
  checkDb()
  const { data, error } = await supabaseAdmin
    .from('media')
    .select('*')
    .eq('userId', userId)
    .order('createdAt', { ascending: false })

  if (error) {
    console.error('Supabase error in getMedia:', error)
    return []
  }
  return data || []
}

export async function addMedia(media: { title: string, url: string, type: string, userId: string }) {
  checkDb()
  const { data, error } = await supabaseAdmin
    .from('media')
    .insert(media)
    .select()
    .single()

  if (error) {
    console.error('Supabase error in addMedia:', error)
    throw error
  }
  return data
}

export async function deleteMedia(id: string, userId: string) {
  checkDb()
  const { error } = await supabaseAdmin
    .from('media')
    .delete()
    .eq('id', id)
    .eq('userId', userId)

  if (error) {
    console.error('Supabase error in deleteMedia:', error)
    throw error
  }
  return true
}
