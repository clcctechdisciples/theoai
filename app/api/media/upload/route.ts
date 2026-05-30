import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { addMedia } from '@/lib/db'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id

  try {
    const formData = await req.formData()
    const files = formData.getAll('files') as File[]
    if (files.length === 0) return NextResponse.json({ error: 'No files uploaded' }, { status: 400 })

    const results = []

    for (const file of files) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      const isImage = file.type.startsWith('image/')
      const isVideo = file.type.startsWith('video/')
      const type = isImage ? 'image' : (isVideo ? 'video' : 'other')

      // Ensure bucket exists
      const { data: buckets } = await supabaseAdmin.storage.listBuckets()
      if (!buckets?.find((b: any) => b.name === 'media')) {
        await supabaseAdmin.storage.createBucket('media', { public: true })
      }

      const fileName = `${userId}/${Date.now()}-${file.name}`
      const { data: uploadData, error: uploadError } = await supabaseAdmin
        .storage
        .from('media')
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: true
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabaseAdmin
        .storage
        .from('media')
        .getPublicUrl(fileName)

      const media = await addMedia({
        title: file.name,
        url: publicUrl,
        type: type,
        userId: userId
      })
      results.push(media)
    }

    return NextResponse.json({ success: true, media: results })
  } catch (error: any) {
    console.error('Media upload error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
