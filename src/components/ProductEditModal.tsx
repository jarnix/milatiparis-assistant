'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ShopifyProduct } from '@/types/shopify'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface ProductEditModalProps {
  product: ShopifyProduct | null
  isOpen: boolean
  onClose: () => void
  onSave: (productId: string, newTitle: string, newDescription: string) => Promise<void>
}

export default function ProductEditModal({ product, isOpen, onClose, onSave }: ProductEditModalProps) {
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  if (!isOpen || !product) return null

  const handleSave = async () => {
    if (!newTitle.trim() && !newDescription.trim()) {
      alert('Please enter at least a title or description')
      return
    }

    setIsSaving(true)
    try {
      await onSave(product.id, newTitle.trim(), newDescription.trim())
      onClose()
      setNewTitle('')
      setNewDescription('')
    } catch (error) {
      console.error('Error saving changes:', error)
      alert('Failed to save changes')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setNewTitle('')
    setNewDescription('')
    onClose()
  }

  const imageUrl = product.featuredImage?.url || product.images.edges[0]?.node.url || '/placeholder.jpg'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Edit Product</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex gap-6">
            <div className="flex-shrink-0">
              <Image
                src={imageUrl}
                alt={product.title}
                width={200}
                height={200}
                className="rounded-lg object-cover"
              />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {product.title}
              </h3>
              <p className="text-sm text-gray-500 mb-2">
                Status: <span className="capitalize">{product.status.toLowerCase()}</span>
              </p>
              <p className="text-sm text-gray-500">
                Created: {new Date(product.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Title
                </label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-gray-900">{product.title}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Enter optimized title..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Description
                </label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg h-32 overflow-y-auto">
                  <p className="text-gray-900 text-sm">
                    {product.description || 'No description available'}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Description
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Enter optimized description..."
                  rows={5}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              onClick={handleCancel}
              className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}