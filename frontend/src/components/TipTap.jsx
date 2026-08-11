import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import api from '@/lib/api'
import { toast } from 'sonner'
import { Image as ImageIcon } from 'lucide-react'

const MenuBar = ({ editor }) => {
  if (!editor) return null

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const fd = new FormData()
    fd.append("file", file)

    try {
      toast.loading("Uploading image...", { id: "upload" })
      const res = await api.post("/admin/media/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" }
      })
      toast.success("Image uploaded", { id: "upload" })
      
      const url = api.defaults.baseURL.replace('/api', '') + res.data.url
      editor.chain().focus().setImage({ src: url }).run()
    } catch (err) {
      toast.error("Upload failed", { id: "upload" })
    }
  }

  return (
    <div className="flex flex-wrap gap-2 border-b border-forest/15 bg-bone p-2 items-center">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`px-2 py-1 text-sm font-bold ${editor.isActive('bold') ? 'bg-forest text-bone' : 'text-forest hover:bg-forest/10'}`}
        type="button"
      >
        B
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`px-2 py-1 text-sm italic ${editor.isActive('italic') ? 'bg-forest text-bone' : 'text-forest hover:bg-forest/10'}`}
        type="button"
      >
        I
      </button>
      <div className="w-px bg-forest/15 mx-1 h-5" />
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`px-2 py-1 text-sm font-bold ${editor.isActive('heading', { level: 2 }) ? 'bg-forest text-bone' : 'text-forest hover:bg-forest/10'}`}
        type="button"
      >
        H2
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`px-2 py-1 text-sm font-bold ${editor.isActive('heading', { level: 3 }) ? 'bg-forest text-bone' : 'text-forest hover:bg-forest/10'}`}
        type="button"
      >
        H3
      </button>
      <div className="w-px bg-forest/15 mx-1 h-5" />
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`px-2 py-1 text-sm ${editor.isActive('bulletList') ? 'bg-forest text-bone' : 'text-forest hover:bg-forest/10'}`}
        type="button"
      >
        • List
      </button>
      <button
        onClick={() => {
          const url = window.prompt('URL')
          if (url) editor.chain().focus().setLink({ href: url }).run()
        }}
        className={`px-2 py-1 text-sm ${editor.isActive('link') ? 'bg-forest text-bone' : 'text-forest hover:bg-forest/10'}`}
        type="button"
      >
        Link
      </button>
      
      <div className="w-px bg-forest/15 mx-1 h-5" />
      
      <label className={`cursor-pointer px-2 py-1 text-sm flex items-center gap-1 text-forest hover:bg-forest/10`}>
        <ImageIcon className="w-4 h-4" /> Image
        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
      </label>
    </div>
  )
}

export default function TipTap({ content, onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base focus:outline-none max-w-none min-h-[300px] p-4',
      },
    },
  })

  return (
    <div className="border border-forest/15 bg-white">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}
