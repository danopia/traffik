require './packets/ieee'

class Radiotap
  def initialize packet
    @length = packet[2,2].unpack('v')[0]
    @inner = IEEE.run packet[@length..-1]
  end
end

